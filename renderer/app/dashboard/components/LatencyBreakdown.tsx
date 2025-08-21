// app/dashboard/components/LatencyBreakdown.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Row = { stage: string; mean: number; p95: number }

const STAGE_COLORS: Record<string,[string,string,string]> = {
    'ASR': ['var(--st-asr)','var(--st-asr-2)','var(--st-asr)'],
    '번역': ['var(--st-tr)','var(--st-tr-2)','var(--st-tr)'],
    'LLM': ['var(--st-llm)','var(--st-llm-2)','var(--st-llm)'],
    'TTS': ['var(--st-tts)','var(--st-tts-2)','var(--st-tts)'],
    'VRM': ['var(--st-vrm)','var(--st-vrm-2)','var(--st-vrm)'],
}

export default function LatencyBreakdown() {
    const [rows, setRows] = useState<Row[]>([
        { stage: 'ASR', mean: 0, p95: 0 },
        { stage: '번역', mean: 0, p95: 0 },
        { stage: 'LLM', mean: 0, p95: 0 },
        { stage: 'TTS', mean: 0, p95: 0 },
        { stage: 'VRM', mean: 0, p95: 0 },
    ])

    useEffect(() => {
        let alive = true
        const tick = async () => {
            if (!alive) return
            setRows([
                { stage: 'ASR', mean: 160 + Math.random() * 20, p95: 260 + Math.random() * 30 },
                { stage: '번역', mean: 80 + Math.random() * 15, p95: 140 + Math.random() * 25 },
                { stage: 'LLM', mean: 350 + Math.random() * 60, p95: 700 + Math.random() * 120 },
                { stage: 'TTS', mean: 220 + Math.random() * 40, p95: 420 + Math.random() * 80 },
                { stage: 'VRM', mean: 70 + Math.random() * 10, p95: 120 + Math.random() * 25 },
            ])
        }
        tick()
        const id = window.setInterval(tick, 6000)
        return () => { alive = false; clearInterval(id) }
    }, [])

    const totalMean = useMemo(() => rows.reduce((a, b) => a + b.mean, 0), [rows])

    const getColors = (share: number) => {
        if (share >= 0.36) return ['#ff8a8a', '#ff6b6b']
        if (share >= 0.22) return ['#ffd98a', '#f5b94e']
        return ['#7fe6c1', '#57c7a6']
    }

    return (
        <div className="card p-4">
            <h3 className="section-title">지연시간 분석</h3>
            <div className="mt-2 flex flex-wrap gap-10 text-xs tone-3">
                <span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full" style={{background:'var(--st-asr)'}}/>ASR</span>
                <span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full" style={{background:'var(--st-tr)'}}/>번역</span>
                <span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full" style={{background:'var(--st-llm)'}}/>LLM</span>
                <span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full" style={{background:'var(--st-tts)'}}/>TTS</span>
                <span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full" style={{background:'var(--st-vrm)'}}/>VRM</span>
            </div>
            <div className="tone-2 text-sm mt-1">
                E2E 평균: <span className="tabular-nums font-semibold">{Math.round(totalMean)} ms</span>
            </div>

            <div className="mt-4 space-y-4">
                {rows.map(r => {
                    const share = r.mean / Math.max(1, totalMean)
                    const [c1,c2,dot] = STAGE_COLORS[r.stage] ?? ['#7fe6c1','#57c7a6','#7fe6c1']
                    const wMean = Math.min(100, share * 100)
                    const wP95  = Math.min(100, (r.p95 / Math.max(1, totalMean)) * 100)
                    const nearP95 = (wP95 - wMean) < 6 && wP95 > wMean
                    const inside = !nearP95 && wMean >= 28
                    const labelLeft = `${Math.min(96, Math.max(4, wMean))}%`

                    return (
                        <div key={r.stage} className="lat-row">
                            <div className="flex items-center justify-between text-sm">
                                <span className="lat-stage" style={{ ['--stage-dot' as any]: dot }}>
                                    <i className="lat-stage__dot" />
                                    <span className="tone-1">{r.stage}</span>
                                </span>
                                <span className="tone-3 tabular-nums">avg {Math.round(r.mean)} · p95 {Math.round(r.p95)} ms</span>
                            </div>

                            <div className="lat-track mt-2">
                                <div
                                    className="lat-mean"
                                    style={{
                                    width: `${wMean}%`,
                                    ['--lat-c1' as any]: c1,
                                    ['--lat-c2' as any]: c2,
                                    }}
                                >
                                    <span
                                        className={`lat-label ${inside ? 'lat-label--inside' : 'lat-label--outside'}`}
                                        style={!inside ? ({ ['--label-left' as any]: labelLeft }) : undefined}
                                        title={`avg ${Math.round(r.mean)} · p95 ${Math.round(r.p95)} ms`}
                                    >
                                    <span className="lat-metric">avg {Math.round(r.mean)}</span>
                                    <span className="lat-sep">·</span>
                                    <span className="lat-metric">p95 {Math.round(r.p95)}</span>
                                    <span className="lat-unit">ms</span>
                                    </span>
                                </div>
                                <div className="lat-p95" style={{ left: `${wP95}%` }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
