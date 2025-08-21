// app/dashboard/components/TopKpis.tsx
'use client'

import { Activity, Timer, ShieldCheck, TriangleAlert } from 'lucide-react'
import { JSX, useEffect, useState } from 'react'

type KPI = { label: string; value: string; sub?: string; icon: JSX.Element }

export default function TopKpis() {
    const [kpis, setKpis] = useState<KPI[]>([
        { label: 'E2E 지연', value: '— ms', sub: '최근 1분', icon: <Timer className="w-4 h-4" /> },
        { label: '처리량', value: '— rps', sub: '최근 1분', icon: <Activity className="w-4 h-4" /> },
        { label: '가용성', value: '— %', sub: '오늘', icon: <ShieldCheck className="w-4 h-4" /> },
        { label: '에러율', value: '— %', sub: '최근 1분', icon: <TriangleAlert className="w-4 h-4" /> },
    ])

    useEffect(() => {
        let alive = true
        const tick = async () => {
            if (!alive) return
            setKpis([
                { label: 'E2E 지연', value: `${Math.round(230 + Math.random()*40)} ms`, sub: '최근 1분', icon: <Timer className="w-4 h-4" /> },
                { label: '처리량', value: `${(1.6 + Math.random()).toFixed(1)} rps`, sub: '최근 1분', icon: <Activity className="w-4 h-4" /> },
                { label: '가용성', value: `${(99.8 + Math.random()*0.1).toFixed(2)} %`, sub: '오늘', icon: <ShieldCheck className="w-4 h-4" /> },
                { label: '에러율', value: `${(0.3 + Math.random()*0.3).toFixed(2)} %`, sub: '최근 1분', icon: <TriangleAlert className="w-4 h-4" /> },
            ])
        }
        tick()
        const id = window.setInterval(tick, 5000)
        return () => { alive = false; clearInterval(id) }
    }, [])

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
                <div key={i} className="card p-4">
                    <div className="flex items-center justify-between">
                        <span className="tone-2 text-sm">{k.label}</span>
                        <span className="inline-flex items-center gap-1 text-xs tone-3">{k.icon}{k.sub}</span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums metric-strong">
                        {k.value}
                    </div>
                </div>
            ))}
        </div>
    )
}