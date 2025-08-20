// app/llm/features/components/mcp/LogPanel.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import {
    Clock,
    FileText,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    RefreshCw,
    Pause,
    Play,
    Search,
    Copy,
    Filter,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from '@/app/common/toast/useToastStore'

type LogType = 'INFO' | 'ERROR' | 'PROCESS' | 'RESULT'
interface LogEntry {
    timestamp: string
    type: LogType
    source: string
    message: string
}

const API_BASE =
    (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'
const LOGS_URL = `${API_BASE}/mcp/api/logs`

function Icon({ type }: { type: LogType }) {
    switch (type) {
        case 'INFO':
            return <FileText className="w-4 h-4 text-white/60" />
        case 'ERROR':
            return <AlertTriangle className="w-4 h-4 text-red-400" />
        case 'PROCESS':
            return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        case 'RESULT':
            return <CheckCircle2 className="w-4 h-4 text-green-400" />
    }
}

const colorByType: Record<LogType, string> = {
    INFO: 'text-white/80',
    ERROR: 'text-red-400',
    PROCESS: 'text-indigo-300',
    RESULT: 'text-green-300',
}


export default function LogsPanel() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(false)

    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | LogType>('all')
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const pollRef = useRef<number | null>(null)

    const reqRef = useRef<AbortController | null>(null)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            reqRef.current?.abort()
        }
    }, [])

    const fetchLogs = useCallback(async (opts?: { silent?: boolean }) => {
        reqRef.current?.abort()
        const ac = new AbortController()
        reqRef.current = ac

        const silent = opts?.silent ?? false
        try {
            if (!silent) setLoading(true)
            const { data } = await axios.get<LogEntry[]>(LOGS_URL, { signal: ac.signal })
            if (!mountedRef.current || ac.signal.aborted) return
            setLogs(data ?? [])
        } catch (e: any) {
            if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return
            console.error('로그 불러오기 실패:', e)
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs({ silent: false })
    }, [fetchLogs])

    useEffect(() => {
        if (!autoRefresh) return
        const id = window.setInterval(() => fetchLogs({ silent: true }), 5000)
        return () => window.clearInterval(id)
    }, [autoRefresh, fetchLogs])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return logs.filter((l) => {
            if (typeFilter !== 'all' && l.type !== typeFilter) return false
            if (!q) return true
            const hay = `${l.timestamp} ${l.source} ${l.type} ${l.message}`.toLowerCase()
            return hay.includes(q)
        })
    }, [logs, query, typeFilter])

    const toggleExpanded = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    const copyLine = (entry: LogEntry) => {
        const text = `[${entry.timestamp}] [${entry.type}] [${entry.source}] ${entry.message}`
        navigator.clipboard
            .writeText(text)
            .then(() => toast.success({ description: '로그가 복사되었습니다.', compact: true }))
            .catch(() => toast.error({ description: '복사 실패', compact: true }))
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-white">
                    <Clock className="w-4 h-4 text-white/70" />
                    <span>Logs</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchLogs({ silent: true })}
                        className="text-[11px] text-white/70 hover:text-white flex items-center gap-1"
                        title="새로고침"
                    >
                        <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                        새로고침
                    </button>
                    <button
                        onClick={() => setAutoRefresh((v) => !v)}
                        className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                        title={autoRefresh ? '자동 새로고침 중지' : '자동 새로고침 시작'}
                    >
                        {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {autoRefresh ? '자동 중지' : '자동 시작'}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-md p-2">
                <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        className="w-full pl-7 pr-3 py-1.5 rounded bg-white/10 text-white text-xs placeholder-white/40"
                        placeholder="검색 (메시지/소스/타입/시간)…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-white/60">
                    <Filter className="w-4 h-4 hidden sm:block" />
                    <select
                        className="shrink-0 w-[96px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                    >
                        <option className="text-black" value="all">
                            전체
                        </option>
                        <option className="text-black" value="INFO">
                            INFO
                        </option>
                        <option className="text-black" value="PROCESS">
                            PROCESS
                        </option>
                        <option className="text-black" value="RESULT">
                            RESULT
                        </option>
                        <option className="text-black" value="ERROR">
                            ERROR
                        </option>
                    </select>
                </div>
            </div>

            <div className="scrollLLMArea max-h-[420px] overflow-y-auto pr-1 overflow-x-hidden">
                {loading && logs.length === 0 ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-white/40 text-sm py-10">표시할 로그가 없습니다.</div>
                ) : (
                    <ul className="space-y-2">
                        {filtered.map((log, i) => {
                            const key = `${log.timestamp}|${log.source}|${log.type}|${i}`
                            const isOpen = expanded.has(key)

                            return (
                                <li
                                    key={key}
                                    className="group rounded-lg p-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="pt-0.5">
                                            <Icon type={log.type} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={clsx(
                                                'flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]',
                                                colorByType[log.type]
                                                )}
                                            >
                                                <span className="tabular-nums">{log.timestamp}</span>
                                                <span className="text-white/50">{log.source}</span>
                                                <span className="uppercase">{log.type}</span>
                                            </div>

                                            <div
                                                className={clsx(
                                                    'mt-0.5 text-white/70 leading-snug break-all cursor-pointer transition-all',
                                                    !isOpen && 'line-clamp-2'
                                                )}
                                                onClick={() => toggleExpanded(key)}
                                                title={isOpen ? '클릭하여 접기' : '클릭하여 펼치기'}
                                            >
                                                {log.message}
                                            </div>
                                        </div>

                                        <button
                                            className="opacity-0 group-hover:opacity-100 transition rounded-md p-1 text-white/70 hover:text-white"
                                            onClick={() => copyLine(log)}
                                            title="복사"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
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
