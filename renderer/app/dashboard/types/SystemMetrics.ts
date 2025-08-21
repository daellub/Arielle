// app/dashboard/types/SystemMetrics.ts
export type GpuMetric = {
    id: number
    name: string
    vendor?: string
    vramTotalMB?: number
    vramUsedMB?: number
    utilizationGpu?: number
    utilizationMem?: number
    temperature?: number
}

export type NpuMetric = {
    supported: boolean
    name?: string
    utilization?: number | null
}

export type SystemMetrics = {
    ts: number

    cpu: {
        model: string
        cores: number
        load: number
        temp?: number
    }

    mem: {
        totalMB: number
        usedMB: number
        freeMB: number
        usedPct: number
    }

    gpu: {
        count: number
        list: GpuMetric[]
        avgUtil?: number
    }

    npu: NpuMetric

    net?: {
        rxMBps?: number
        txMBps?: number
    }

    disk?: {
        usedPct?: number
    }
}
