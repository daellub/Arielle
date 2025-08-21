// app/dashboard/components/LogHub.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, AlertTriangle, FileText, X } from 'lucide-react'
import clsx from 'clsx'
import { logBus, LogFilterPayload } from '@/app/dashboard/lib/logBus'

type LogType = 'INFO' | 'ERROR' | 'PROCESS' | 'RESULT'
type LogEntry = { ts: string; type: LogType; src: string; msg: string }

export default function LogHub({ tabs }: { tabs: { key: string; label: string }[] }) {
    const [active, setActive] = useState(tabs[0]?.key ?? 'asr')
    const [query, setQuery] = useState('')
    const [logs, setLogs] = useState<Record<string, LogEntry[]>>({})

    useEffect(() => {
        let alive = true
        const gen = (src: string): LogEntry[] =>
            Array.from({ length: 18 }).map((_, i) => ({
                ts: new Date(Date.now() - i*1200).toISOString().slice(11,19),
                type: Math.random() > .85 ? 'ERROR' : Math.random() > .5 ? 'INFO' : 'PROCESS',
                src, msg: `${src} message #${i} …`,
            }))
        setLogs(Object.fromEntries(tabs.map(t => [t.key, gen(t.key)])))
        const id = window.setInterval(() => alive && setLogs(prev =>
            Object.fromEntries(tabs.map(t => [t.key, [(gen(t.key)[0]), ...(prev[t.key]||[])]?.slice(0,120)]))
        ), 5000)
        return () => { alive = false; clearInterval(id) }
    }, [tabs])

    useEffect(() => {
        const onFilter = (e: Event) => {
            const { tab, query } = (e as CustomEvent<LogFilterPayload>).detail || {}
            if (tab) setActive(tab)
            if (typeof query === 'string') setQuery(query)
        }
        logBus.addEventListener('log:filter', onFilter)
        return () => logBus.removeEventListener('log:filter', onFilter)
    }, [])

    const filtered = useMemo(() => {
        const list = logs[active] ?? []
        const q = query.trim().toLowerCase()
        if (!q) return list
        return list.filter(l => `${l.ts} ${l.src} ${l.type} ${l.msg}`.toLowerCase().includes(q))
    }, [logs, active, query])

    return (
        <div className="card p-4 h-[420px]">
            <div className="flex items-center justify-between">
                <h3 className="section-title">로그 스트림</h3>
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="text-xs inline-flex items-center gap-1 text-white/70 hover:text-white"
                        title="필터 해제"
                    >
                        <X className="w-4 h-4" /> 필터 해제
                    </button>
                )}
                <button className="text-white/70 hover:text-white text-xs inline-flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" /> 새로고침
                </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded bg-white/10 ring-1 ring-white/10 px-2 py-1">
                    <Search className="w-4 h-4 text-white/60" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="검색 (메시지/소스/타입/시간)…"
                        className="bg-transparent text-xs text-white/90 outline-none ml-1 placeholder:text-white/40"
                    />
                </div>
                <div className="flex flex-wrap gap-1">
                    {tabs.map(t => {
                        const isActive = active === t.key
                        return (
                            <button
                                key={t.key}
                                onClick={() => setActive(t.key)}
                                className={clsx(
                                    'px-2 py-0.5 rounded-full text-[11px] border transition',
                                    isActive
                                        ? 'bg-white text-[#1d2a55] border-white'
                                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                                )}
                            >
                                {t.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="scrollDashboardArea mt-3 h-[300px] overflow-auto pr-1">
                {filtered.length === 0 ? (
                    <div className="text-center text-white/40 text-sm py-10">표시할 로그가 없습니다.</div>
                ) : (
                    <ul className="space-y-2">
                        {filtered.map((l, i) => {
                            const isErr = l.type === 'ERROR'
                            return (
                                <li
                                    key={`${l.ts}-${i}`}
                                    className={clsx(
                                        'rounded-lg p-2 ring-1 transition',
                                        isErr
                                            ? 'ring-rose-400/30 bg-rose-400/5 hover:bg-rose-400/10'
                                            : 'ring-white/10 bg-white/5 hover:bg-white/[.07]'
                                    )}
                                    style={isErr ? { boxShadow: 'inset 3px 0 0 rgba(244,63,94,.65)' } : undefined}
                                >
                                    <div className="grid grid-cols-[68px_92px_84px_1fr] gap-2 items-start">
                                        <span className="font-mono text-[11px] tabular-nums text-white/65">{l.ts}</span>
                                        <span className="text-[11px] uppercase text-white/80">{l.src}</span>
                                        <span
                                            className={clsx(
                                                'justify-self-start text-[10px] px-2 py-0.5 rounded-full border',
                                                l.type === 'ERROR'
                                                ? 'bg-rose-400/15 border-rose-400/30 text-rose-100'
                                                : l.type === 'PROCESS'
                                                ? 'bg-sky-400/10 border-sky-400/25 text-sky-100'
                                                : l.type === 'RESULT'
                                                ? 'bg-emerald-400/10 border-emerald-400/25 text-emerald-100'
                                                : 'bg-white/10 border-white/15 text-white/75'
                                            )}
                                        >
                                            {l.type}
                                        </span>
                                        <div className="text-white/85 text-sm leading-snug break-all">
                                            {l.msg}
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}
