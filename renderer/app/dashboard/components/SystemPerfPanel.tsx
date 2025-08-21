// app/dashboard/components/SystemPerfPanel.tsx
'use client'

import React from 'react'
import useSystemMetrics from '@/app/dashboard/hooks/useSystemMetrics'
import {
    Area, AreaChart, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid
} from 'recharts'
import { Chip } from './atoms/Chip'
import clsx from 'clsx'

function pct(n?: number) { return (n ?? 0).toFixed(0) + '%' }
function mb(n?: number) { return (n ?? 0).toFixed(0) + ' MB' }

export default function SystemPerfPanel() {
    const { latest, history } = useSystemMetrics()

    const cpuData = history.map((h: { ts: any; cpu: { load: any } }) => ({ t: h.ts, v: h.cpu.load }))
    const memData = history.map((h: { ts: any; mem: { usedPct: any } }) => ({ t: h.ts, v: h.mem.usedPct }))
    const gpuData = history.map(h => ({ t: h.ts, v: h.gpu?.avgUtil ?? 0 }))
    const netData = history.map(h => ({ t: h.ts, rx: h.net?.rxMBps ?? 0, tx: h.net?.txMBps ?? 0 }))

    return (
        <div className="mx-auto max-w-6xl w-full grid grid-cols-12 gap-6">
        {/* 상단 스탯 카드 4개 */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
            <StatCard
            title="CPU"
            main={pct(latest?.cpu.load)}
            sub={`${latest?.cpu.model ?? ''} · ${latest?.cpu.cores ?? 0}c`}
            />
            <StatCard
            title="메모리"
            main={pct(latest?.mem.usedPct)}
            sub={`${mb(latest?.mem.usedMB)} / ${mb(latest?.mem.totalMB)}`}
            />
            <StatCard
            title="GPU"
            main={latest?.gpu.count ? pct(latest?.gpu.avgUtil) : '—'}
            sub={latest?.gpu.list?.[0]?.name ?? '감지됨: ' + (latest?.gpu.count ?? 0) + '개'}
            />
            <StatCard
            title="네트워크"
            main={`${(latest?.net?.rxMBps ?? 0).toFixed(1)} / ${(latest?.net?.txMBps ?? 0).toFixed(1)} MB/s`}
            sub="RX / TX"
            />
        </div>

        {/* 그래프 영역 */}
        <ChartCard className="col-span-12 md:col-span-6" title="CPU Load">
            <MiniArea data={cpuData} />
        </ChartCard>

        <ChartCard className="col-span-12 md:col-span-6" title="Memory Used %">
            <MiniArea data={memData} />
        </ChartCard>

        <ChartCard className="col-span-12 md:col-span-6" title="GPU Avg Util %">
            <MiniArea data={gpuData} />
            {latest?.gpu.count === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
                지원 GPU 정보를 찾지 못했어요
            </div>
            )}
        </ChartCard>

        <ChartCard className="col-span-12 md:col-span-6" title="Network MB/s">
            <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={netData}>
                <defs>
                <linearGradient id="rx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="tx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3"/>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip contentStyle={{ background:'rgba(20,22,34,0.9)', border:'1px solid rgba(255,255,255,0.12)'}} />
                <Area type="monotone" dataKey="rx" stroke="#60a5fa" fillOpacity={1} fill="url(#rx)" />
                <Area type="monotone" dataKey="tx" stroke="#34d399" fillOpacity={1} fill="url(#tx)" />
            </AreaChart>
            </ResponsiveContainer>
        </ChartCard>

        {/* GPU 상세(있을 때만) */}
        {latest?.gpu.list?.length ? (
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {latest.gpu.list.map((g) => (
                <div key={g.id} className="rounded-2xl p-4 bg-white/5 ring-1 ring-white/10 text-white/85">
                <div className="flex items-center justify-between">
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-white/60">{g.vendor ?? ''}</div>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                    <Chip label={`GPU ${g.utilizationGpu ?? 0}%`} tone="indigo" />
                    {g.utilizationMem != null && <Chip label={`VRAM ${g.utilizationMem}%`} tone="sky" />}
                    {g.temperature != null && <Chip label={`${g.temperature}°C`} tone="rose" />}
                    {g.vramTotalMB != null && <Chip label={`${g.vramUsedMB ?? 0}/${g.vramTotalMB} MB`} tone="slate" />}
                </div>
                </div>
            ))}
            </div>
        ) : null}
        </div>
    )
}

function StatCard({ title, main, sub }: { title: string; main: React.ReactNode; sub?: React.ReactNode }) {
    return (
        <div className="rounded-2xl p-4 bg-white/5 ring-1 ring-white/10 text-white relative overflow-hidden">
            <div className="text-xs text-white/60">{title}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{main}</div>
            {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
            <div className="pointer-events-none absolute -inset-px opacity-30"
                style={{background:'radial-gradient(600px 120px at 10% -10%, rgba(99,102,241,0.15), transparent 40%)'}}/>
        </div>
    )
}

function ChartCard({ title, children, className }:{title:string; children:React.ReactNode; className?:string}) {
    return (
        <div className={clsx('rounded-2xl p-4 bg-white/5 ring-1 ring-white/10 text-white relative', className)}>
            <div className="text-xs text-white/60 mb-2">{title}</div>
            <div className="h-[160px] relative">{children}</div>
        </div>
    )
}

function MiniArea({ data }:{data:{t:number; v:number}[]}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3"/>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background:'rgba(20,22,34,0.9)', border:'1px solid rgba(255,255,255,0.12)'}} />
                <Area type="monotone" dataKey="v" stroke="#a78bfa" fillOpacity={1} fill="url(#g)" />
            </AreaChart>
        </ResponsiveContainer>
    )
}
