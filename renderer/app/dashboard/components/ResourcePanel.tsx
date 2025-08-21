// app/dashboard/components/ResourcePanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Point = { t: number; cpu: number; gpu: number; mem: number; npu: number; netIn: number; netOut: number }

export default function ResourcePanel() {
    const [data, setData] = useState<Point[]>([])

    useEffect(() => {
        let alive = true
        const seed = () =>
            Array.from({ length: 30 }).map((_, i) => ({
                t: i,
                cpu: 25 + Math.random()*30,
                gpu: 10 + Math.random()*35,
                mem: 40 + Math.random()*20,
                npu: 5 + Math.random()*25,
                netIn: 200 + Math.random()*150,
                netOut: 120 + Math.random()*130,
            }))
        setData(seed())
        const id = window.setInterval(() => alive && setData(d => {
            const last = d[d.length-1]?.t ?? 0
            const next = {
                t: last + 1,
                cpu: 25 + Math.random()*30,
                gpu: 10 + Math.random()*35,
                mem: 40 + Math.random()*20,
                npu: 5 + Math.random()*25,
                netIn: 200 + Math.random()*150,
                netOut: 120 + Math.random()*130,
            }
            return [...d.slice(-29), next]
        }), 1500)
        return () => { alive = false; clearInterval(id) }
    }, [])

    return (
        <div className="card p-4">
            <h3 className="section-title">리소스 사용량</h3>

            <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-lg p-3 bg-white/5 ring-1 ring-white/10 h-[180px]">
                    <div className="legend">
                        <span className="legend__item"><i className="legend__dot" style={{ background: 'var(--cpu)' }} />CPU</span>
                        <span className="legend__item"><i className="legend__dot" style={{ background: 'var(--gpu)' }} />GPU</span>
                        <span className="legend__item"><i className="legend__dot" style={{ background: 'var(--npu)' }} />NPU</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="g_cpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--cpu)" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="var(--cpu)" stopOpacity="0.06" />
                                </linearGradient>
                                <linearGradient id="g_gpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--gpu)" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="var(--gpu)" stopOpacity="0.06" />
                                </linearGradient>
                                <linearGradient id="g_npu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--npu)" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="var(--npu)" stopOpacity="0.06" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeOpacity={0.12} vertical={false} />
                            <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,.55)', fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,.55)', fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: 'rgba(20,24,40,.92)', border: '1px solid rgba(255,255,255,.15)' }} />
                            <Area type="monotone" dataKey="cpu" stroke="var(--cpu)" strokeWidth={2} fill="url(#g_cpu)" />
                            <Area type="monotone" dataKey="gpu" stroke="var(--gpu)" strokeWidth={2} fill="url(#g_gpu)" />
                            <Area type="monotone" dataKey="npu" stroke="var(--npu)" strokeWidth={2} fill="url(#g_npu)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-lg p-3 bg-white/5 ring-1 ring-white/10 h-[180px]">
                    <div className="legend">
                        <span className="legend__item"><i className="legend__dot" style={{ background: 'var(--mem)' }} />MEM</span>
                        <span className="legend__item"><i className="legend__dot" style={{ background: 'var(--net-in)' }} />Net In</span>
                        <span className="legend__item"><i className="legend__dot" style={{ background: 'var(--net-out)' }} />Net Out</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeOpacity={0.12} vertical={false} />
                            <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,.55)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,.55)', fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: 'rgba(20,24,40,.92)', border: '1px solid rgba(255,255,255,.15)' }} />
                            <Area type="monotone" dataKey="mem"   stroke="var(--mem)"    strokeWidth={2} fillOpacity={0.10} fill="var(--mem)" />
                            <Area type="monotone" dataKey="netIn" stroke="var(--net-in)" strokeWidth={2} fillOpacity={0.08}  fill="var(--net-in)" />
                            <Area type="monotone" dataKey="netOut"stroke="var(--net-out)"strokeWidth={2} fillOpacity={0.08}  fill="var(--net-out)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
