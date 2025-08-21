// app/dashboard/components/ModuleHealth.tsx
'use client'

import { Brain, Mic, Languages, Volume2, Smile, Server, Database } from 'lucide-react'
import { JSX, useEffect, useState } from 'react'
import clsx from 'clsx'

type Item = { key: string; label: string; status: 'healthy' | 'degraded' | 'down'; icon: JSX.Element }

const DEFAULTS: Item[] = [
    { key: 'backend',   label: '백엔드',   status: 'healthy',  icon: <Server className="w-4 h-4" /> },
    { key: 'db',        label: 'DB',       status: 'healthy',  icon: <Database className="w-4 h-4" /> },
    { key: 'asr',       label: 'ASR',      status: 'healthy',  icon: <Mic className="w-4 h-4" /> },
    { key: 'translate', label: '번역',      status: 'healthy',  icon: <Languages className="w-4 h-4" /> },
    { key: 'llm',       label: 'LLM',      status: 'healthy',  icon: <Brain className="w-4 h-4" /> },
    { key: 'tts',       label: 'TTS',      status: 'healthy',  icon: <Volume2 className="w-4 h-4" /> },
    { key: 'vrm',       label: 'VRM',      status: 'healthy',  icon: <Smile className="w-4 h-4" /> },
]

export default function ModuleHealth() {
    const [items, setItems] = useState<Item[]>(DEFAULTS)

    useEffect(() => {
        let alive = true
        const tick = async () => {
            // TODO: /health 엔드포인트 연결
            if (!alive) return
            setItems(prev => prev.map(it => {
                // 데모: 랜덤하게 한두 개 상태 바뀜
                const r = Math.random()
                const status = r > 0.96 ? 'down' : r > 0.88 ? 'degraded' : 'healthy'
                return { ...it, status: Math.random() > 0.9 ? status : it.status }
            }))
        }
        tick()
        const id = window.setInterval(tick, 6000)
        return () => { alive = false; clearInterval(id) }
    }, [])

    const tone = (s: Item['status']) =>
        s === 'healthy'  ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30' :
        s === 'degraded' ? 'bg-amber-500/15  text-amber-200  ring-amber-400/30' :
                        'bg-rose-500/15   text-rose-200   ring-rose-400/30'

    return (
        <div className="card p-4">
            <h3 className="section-title">시스템 상태</h3>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(it => (
                    <div key={it.key} className="rounded-lg p-3 bg-white/5 ring-1 ring-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white/85">
                                {it.icon}<span className="text-sm">{it.label}</span>
                            </div>
                            <span className={clsx('px-2 py-0.5 rounded-full text-[10px] ring-1', tone(it.status))}>
                                {it.status === 'healthy' ? '정상' : it.status === 'degraded' ? '부분 저하' : '중단'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
