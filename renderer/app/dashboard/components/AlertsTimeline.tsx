// app/dashboard/components/AlertsTimeline.tsx
'use client'

import React from 'react'

const demo = [
    { ts: '12:40:12', sev: 'warn', msg: '[ASR] Endpoint timeout p95>800ms' },
    { ts: '12:38:04', sev: 'info', msg: '[LLM] 모델 리로드 완료 (q4_k_m)' },
    { ts: '12:30:11', sev: 'error', msg: '[TTS] PCM underrun 3회' },
]

export default function AlertsTimeline() {
    return (
        <div className="card p-4 h-full">
            <h3 className="section-title">사건 타임라인</h3>
            <ul className="mt-3 space-y-3">
                {demo.map((e, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <span className="text-xs text-white/50 w-14 mt-0.5">{e.ts}</span>
                        <span className={
                            e.sev === 'error' ? 'pill pill-rose' :
                            e.sev === 'warn' ? 'pill pill-amber' : 'pill pill-indigo'
                        }>{e.msg}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
