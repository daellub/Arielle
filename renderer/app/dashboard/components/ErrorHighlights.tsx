// app/dashboard/components/ErrorHighlights.tsx
'use client'

import { useEffect, useState } from 'react'
import { emitLogFilter } from '@/app/dashboard/lib/logBus'
import { ResponsiveContainer, LineChart, Line } from 'recharts'

type Mod = 'asr' | 'translate' | 'llm' | 'tts' | 'vrm'
type Sev = 'critical' | 'high' | 'warn' | 'info'

type Highlight = {
    id: string
    module: Mod
    title: string
    severity: Sev
}

type Item = Highlight & {
    count: number
    trend: { x: number; y: number }[]
}

const MOD_COLOR: Record<Mod, string> = {
    asr: 'var(--st-asr)',
    translate: 'var(--st-tr)',
    llm: 'var(--st-llm)',
    tts: 'var(--st-tts)',
    vrm: 'var(--st-vrm)',
}

const SEV_TONE: Record<Sev, string> = {
    critical: 'bg-rose-400/15 ring-rose-400/30 text-rose-100',
    high: 'bg-rose-400/12 ring-rose-400/25 text-rose-100',
    warn: 'bg-amber-400/12 ring-amber-400/25 text-amber-100',
    info: 'bg-indigo-400/12 ring-indigo-400/25 text-indigo-100',
}

const SEED: Highlight[] = [
    { id:'tts-underrun', module:'tts', title:'[TTS] PCM Buffer underrun', severity:'high' },
    { id:'asr-timeout', module:'asr', title:'[ASR] Endpoint timeout', severity:'warn' },
    { id:'llm-throttle', module:'llm', title:'[LLM] Token throttle', severity:'info' },
]

export default function ErrorHighlights() {
    const [items, setItems] = useState<Item[]>(
        SEED.map((h) => ({
            ...h,
            count: Math.floor(2 + Math.random()*4),
            trend: Array.from({length: 24}).map((_,i)=>({ x:i, y: Math.floor(Math.random()*3) }))
        }))
    )

    useEffect(() => {
        let alive = true
        const id = window.setInterval(() => {
            if (!alive) return
            setItems(prev => prev.map(it => {
                const nextY = Math.max(0, Math.min(8, it.trend[it.trend.length-1].y + (Math.random()>.5?1:-1)))
                const trend = [...it.trend.slice(-23), { x: (it.trend[it.trend.length-1].x+1), y: nextY }]
                const recentSum = trend.slice(-6).reduce((a,b)=>a+b.y,0) // 최근 6틱 합
                return { ...it, trend, count: recentSum }
            }))
        }, 10_000)
        return () => { alive = false; clearInterval(id) }
    }, [])

    const onClick = (h: Highlight) => {
        emitLogFilter({ tab: h.module, query: h.title.replace(/\[.*?\]\s*/,'') })
    }

    return (
        <div className="card p-4">
            <h3 className="section-title">오류 로그 하이라이트</h3>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((h) => (
                    <button
                        key={h.id}
                        onClick={() => onClick(h)}
                        className={`group relative text-left rounded-xl px-3 py-2 ring-1 ${SEV_TONE[h.severity]} hover:brightness-110 transition`}
                        title="클릭하면 로그 스트림이 해당 이슈로 필터링됩니다"
                    >
                        <span
                            aria-hidden
                            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                            style={{ background: MOD_COLOR[h.module] }}
                        />

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] text-white/90 truncate">{h.title}</span>

                            <span className="px-2 py-0.5 text-[11px] rounded-full ring-1 bg-white/10 ring-white/20 text-white/85">
                                {h.count}회
                            </span>
                        </div>

                        <div className="mt-2 h-[28px]" style={{ color: MOD_COLOR[h.module] }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={h.trend}>
                                <Line
                                    type="monotone"
                                    dataKey="y"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-1 text-[11px] text-white/45">
                            최근 발생 트렌드 · 클릭하여 필터
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
