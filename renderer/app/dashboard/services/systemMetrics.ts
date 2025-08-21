// app/dashboard/services/systemMetrics.ts
import { BrowserWindow, ipcMain } from 'electron'
import si from 'systeminformation'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { SystemMetrics, GpuMetric } from '@/app/dashboard/types/SystemMetrics'

const execFileAsync = promisify(execFile)

let timer: NodeJS.Timeout | null = null
let subscribers = 0
let lastNet = { rx: 0, tx: 0, time: 0 }

async function tryNvidiaSmi(): Promise<GpuMetric[] | null> {
    try {
        const { stdout } = await execFileAsync('nvidia-smi', [
            '--query-gpu=index,name,utilization.gpu,utilization.memory,memory.total,memory.used,temperature.gpu',
            '--format=csv,noheader,nounits'
        ])
        const list = stdout.trim().split('\n').map((line) => {
            const [id, name, util, memUtil, vramTotal, vramUsed, temp] = line.split(',').map(s => s.trim())
            return {
                id: Number(id),
                name,
                utilizationGpu: Number(util),
                utilizationMem: Number(memUtil),
                vramTotalMB: Number(vramTotal),
                vramUsedMB: Number(vramUsed),
                temperature: Number(temp),
                vendor: 'NVIDIA'
            } as GpuMetric
        })
        return list
    } catch {
        return null
    }
}

async function collect(): Promise<SystemMetrics> {
    const [cpu, mem, temp, graphics, fs, net] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.cpuTemperature().catch(() => ({ main: undefined })),
        si.graphics().catch(() => ({ controllers: [] })),
        si.fsSize().catch(() => []),
        si.networkStats().catch(() => [])
    ])

    let gpuList: GpuMetric[] = []
    if (graphics?.controllers?.length) {
        gpuList = graphics.controllers.map((c, i) => ({
        id: i,
        name: c.model,
        vendor: c.vendor,
        vramTotalMB: c.vram ? Math.round(c.vram) : undefined,
        vramUsedMB: c.memoryUsed ? Math.round(c.memoryUsed) : undefined,
        utilizationGpu: c.utilizationGpu ?? undefined,
        utilizationMem: c.utilizationMemory ?? undefined,
        temperature: c.temperatureGpu ?? undefined
        }))
    } else {
        const nv = await tryNvidiaSmi()
        if (nv) gpuList = nv
    }

    // CPU Load (1초 평균)
    const load = await si.currentLoad()
    const cpuLoad = load.currentLoad ?? 0

    // Network 사용량(MB/s)
    let rxMBps: number | undefined
    let txMBps: number | undefined
    const now = Date.now()
    if (net?.length) {
        const agg = net.reduce((acc, n) => {
        acc.rx += n.rx_bytes
        acc.tx += n.tx_bytes
        return acc
        }, { rx: 0, tx: 0 })
        if (lastNet.time) {
        const dt = (now - lastNet.time) / 1000
        rxMBps = (agg.rx - lastNet.rx) / 1024 / 1024 / dt
        txMBps = (agg.tx - lastNet.tx) / 1024 / 1024 / dt
        }
        lastNet = { rx: agg.rx, tx: agg.tx, time: now }
    }

    // Disk 사용률(최대 볼륨 기준)
    let usedPct: number | undefined
    if (Array.isArray(fs) && fs.length) {
        const biggest = fs.reduce((a, b) => (a.size > b.size ? a : b))
        usedPct = biggest.use
    }

    // NPU(표준 API가 없으므로 플레이스홀더; 추후 모듈이 IPC로 push 가능)
    const npu = { supported: false } as SystemMetrics['npu']

    const metrics: SystemMetrics = {
        ts: now,
        cpu: {
        model: cpu.brand,
        cores: cpu.cores,
        load: Math.round(cpuLoad * 10) / 10,
        temp: temp?.main ? Math.round(temp.main) : undefined
        },
        mem: {
        totalMB: Math.round(mem.total / 1024 / 1024),
        usedMB: Math.round((mem.total - mem.available) / 1024 / 1024),
        freeMB: Math.round(mem.available / 1024 / 1024),
        usedPct: Math.round(((mem.total - mem.available) / mem.total) * 1000) / 10
        },
        gpu: {
        count: gpuList.length,
        list: gpuList,
        avgUtil: gpuList.length
            ? Math.round(
                gpuList
                .map(g => g.utilizationGpu ?? 0)
                .reduce((a, b) => a + b, 0) / gpuList.length
            )
            : undefined
        },
        npu,
        net: { rxMBps, txMBps },
        disk: { usedPct }
    }

    return metrics
}

function startPushing(win: BrowserWindow) {
    if (timer) return
    timer = setInterval(async () => {
        try {
            const data = await collect()
            if (!win.isDestroyed()) win.webContents.send('sys:metrics', data)
        } catch {}
    }, 1000)
}

function stopPushing() {
    if (timer && subscribers === 0) {
        clearInterval(timer)
        timer = null
    }
}

export function registerSystemMetrics(win: BrowserWindow) {
    ipcMain.handle('sys:metrics:snapshot', async () => collect())
    ipcMain.on('sys:metrics:subscribe', () => {
        subscribers += 1
        startPushing(win)
    })
    ipcMain.on('sys:metrics:unsubscribe', () => {
        subscribers = Math.max(0, subscribers - 1)
        stopPushing()
    })

    // (선택) 외부 모듈이 NPU 사용률을 push 할 수 있도록
    ipcMain.on('sys:npu:update', (_e, payload: { name?: string; utilization?: number }) => {
        // 여기서는 메모리에만 보관해도 되고, collect() 내에서 공유해도 됨.
        // 간단화를 위해 전역 업데이트만 예시로 남김
        // ex) npuState = { supported: true, ...payload }
    })
}
