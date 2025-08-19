// app/asr/features/components/SystemLog.tsx
'use client'

import styles from './SystemLog.module.css'
import LogSearchBar from './LogSearchBar'

import clsx from 'clsx'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import axios from 'axios'
import { Clock, BarChart3, FileText } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip} from 'recharts'

type LogType = 'PROCESS' | 'RESULT' | 'DB' | 'ERROR' | 'INFO'

interface RawLog {
    timestamp: string
    type: LogType
    message: string
}

interface LogEntry {
    iso: string
    ts: number
    display: string
    type: LogType
    message: string
}

interface ChartDataPoint {
    name: string
    cl: number // 현재
    pl: number // 이전
}

const MAX_RENDERED_LOGS = 500
const POLL_MS = 3000

const formatDisplay = (iso: string) => {
    const d = new Date(iso)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}. ${mm}. ${dd}. ${hh}:${mi}:${ss}`
}

const toEntry = (log: RawLog): LogEntry => ({
    iso: log.timestamp,
    ts: new Date(log.timestamp).getTime(),
    display: formatDisplay(log.timestamp),
    type: log.type,
    message: log.message
})

const scoreOf = (t: LogType): number =>
    t === 'ERROR' ? 4 : t === 'RESULT' ? 3 : t === 'DB' ? 2 : t === 'PROCESS' ? 2 : 1

const buildChartPoints = (logs: LogEntry[]): ChartDataPoint[] => {
    const now = Date.now()
    const minutes: string[] = []
    const minuteKey = (ms: number) => {
        const d = new Date(ms)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    for (let i = 9; i >= 0; i--) {
        minutes.push(minuteKey(now - i * 60_000)) // 10분 전부터 현재까지
    }

    const bucketScore: Record<string, number> = {}
    for (const m of minutes) bucketScore[m] = 0

    for (const l of logs) {
        const k = minuteKey(l.ts)
        if (k in bucketScore) bucketScore[k] += scoreOf(l.type)
    }

    const pts: ChartDataPoint[] = []
    let prev = 0
    for (const m of minutes) {
        const curr = bucketScore[m] ?? 0
        pts.push({ name: m, cl: curr, pl: prev })
        prev = curr
    }

    return pts
}

export default function SystemLog() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [nowStr, setNowStr] = useState('')

    const [filterTypes, setFilterTypes] = useState<LogType[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const mountIso = useMemo(() => new Date().toISOString(), [])
    const logEndRef = useRef<HTMLDivElement>(null)
    const prevCountRef = useRef<number>(0)
    const pollAbortRef = useRef<AbortController | null>(null)
    const suggestAbortRef = useRef<AbortController | null>(null)
    const searchAbortRef = useRef<AbortController | null>(null)
    const pollingRef = useRef<number | null>(null)
    
    const toggleFilter = useCallback((t: LogType) => {
        setFilterTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
    }, [])

    const displayedLogs = useMemo(() => {
        const base = searchQuery ? filteredLogs : logs
        const withType = filterTypes.length === 0 ? base : base.filter((l) => filterTypes.includes(l.type))
        const withQuery = searchQuery
            ? withType.filter((l) => l.message.toLowerCase().includes(searchQuery.toLowerCase()))
            : withType
        return withQuery.slice(-MAX_RENDERED_LOGS)
    }, [logs, filteredLogs, searchQuery, filterTypes])

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([])
            return
        }
        suggestAbortRef.current?.abort()
        const ctrl = new AbortController()
        suggestAbortRef.current = ctrl

        const id = setTimeout(async () => {
            try {
                const res = await axios.get('http://localhost:8000/asr/log-suggestions', {
                    params: { q: searchQuery },
                    signal: ctrl.signal,
                })
                setSuggestions(Array.isArray(res.data) ? res.data : [])
            } catch {
                if (!ctrl.signal.aborted) setSuggestions([])
            }
        }, 250)

        return () => {
            clearTimeout(id)
            ctrl.abort()
        }
    }, [searchQuery])

    const fetchLogsByQuery = useCallback(async (q: string) => {
        searchAbortRef.current?.abort()
        const ctrl = new AbortController()
        searchAbortRef.current = ctrl
        setIsSearching(true)
        
        try {
            const res = await axios.get('http://localhost:8000/asr/logs', {
                params: { query: q },
                signal: ctrl.signal,
            })
            const list: LogEntry[] = (res.data as RawLog[]).map(toEntry)
            setFilteredLogs(list)
        } catch {
            if (!ctrl.signal.aborted) setFilterTypes([])
        } finally {
            if (!ctrl.signal.aborted) setIsSearching(false)
        }
    }, [])

    const handleSearch = useCallback(() => {
        if (searchQuery.trim()) fetchLogsByQuery(searchQuery.trim())
    }, [fetchLogsByQuery, searchQuery])

    const handleSelect = useCallback(
        (kw: string) => {
            setSearchQuery(kw)
            fetchLogsByQuery(kw)
        },
        [fetchLogsByQuery]
    )

    const fetchAll = useCallback(async (signal: AbortSignal) => {
        const res = await axios.get('http://localhost:8000/asr/logs', {
            params: { limit: 200, since: mountIso },
            signal,
        })
        const raw = (res.data as RawLog[]).filter((l) => new Date(l.timestamp) >= new Date(mountIso))
        const mapped = raw.map(toEntry)
        setLogs(mapped)
    }, [mountIso])

    useEffect(() => {
        if (searchQuery.trim()) {
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current)
                pollingRef.current = null
            }
            pollAbortRef.current?.abort()
            return
        }

        pollAbortRef.current?.abort()
        const ctrl = new AbortController()
        pollAbortRef.current = ctrl

        const doPoll = () => fetchAll(ctrl.signal).catch(() => {})
        doPoll()
        const iv = window.setInterval(doPoll, POLL_MS)
        pollingRef.current = iv

        return () => {
            ctrl.abort()
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current)
                pollingRef.current = null
            }
        }
    }, [fetchAll, searchQuery])

    useEffect(() => {
        setChartData(buildChartPoints(logs))
    }, [logs])

    useEffect(() => {
        const iv = window.setInterval(() => {
            setNowStr(
                new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                })
            )
        }, 1000)
        return () => window.clearInterval(iv)
    }, [])

    useEffect(() => {
        const prev = prevCountRef.current
        const curr = displayedLogs.length
        if (curr > curr && logEndRef.current) {
            const container = logEndRef.current.closest(`.${styles.scrollContainer}`)
            if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
            }
        }
        prevCountRef.current = curr
    }, [displayedLogs])

    return (
        <>
            <LogSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                suggestions={suggestions}
                onSelect={handleSelect}
            />

            <div className='relative'>
                <div className="w-[640px] h-[320px] mt-5 bg-white/50 backdrop-blur-md border border-white/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)] rounded-2xl px-6 py-5 transition-all overflow-hidden flex flex-col">
                    {/* 헤더 */}
                    <div className="shrink-0 flex justify-between items-center mb-2">
                        <div className="flex p-3 items-center gap-4">
                            <h3 className="text-lg text-[27px] text-black">Log</h3>
                            <span className="px-3 py-2 bg-black text-white text-[13px] text-sm rounded-full">
                                +{displayedLogs.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-black" />
                            <div className="text-xs text-black">
                                <div className="font-medium text-[14px]">Time</div>
                                <div className="font-TheCircleM text-[12px] tracking-[-0.035em]">{nowStr}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-7.5 h-7.5 text-black" />
                            <div>
                                <span className="text-black text-[13px]">Activities</span>
                                <div className="w-[120px] h-[36px]">
                                    <ResponsiveContainer width="100%" height={36}>
                                        <LineChart data={chartData}>
                                            <XAxis dataKey="name" hide />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    fontSize: '11px',
                                                    borderRadius: '6px',
                                                    boxShadow: '0 0 6px rgba(0,0,0,0.2)',
                                                }}
                                                formatter={(v: number, name: string) => [`${v}`, name === 'cl' ? '현재' : '이전']}
                                            />
                                            <Line type="monotone" dataKey="cl" stroke="#000" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="pl" stroke="gray" strokeWidth={2} strokeOpacity={0.5} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 flex gap-2 px-3 mb-2">
                        {(['INFO', 'ERROR', 'PROCESS', 'DB', 'RESULT'] as LogType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => toggleFilter(type as any)}
                                className={`text-xs px-3 py-1 rounded-full border transition ${
                                    filterTypes.includes(type as any)
                                        ? 'bg-black text-white'
                                        : 'bg-white text-black border-zinc-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 min-h-0 bg-black text-white rounded-[30px] overflow-hidden">
                        <div className={`${styles.scrollContainer} h-full`}>
                            {isSearching ? (
                                <div className='px-6 py-4 space-y-2'>
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-[14px] bg-neutral-700 rounded animate-pulse w-[80%]" />
                                    ))}
                                </div>
                            ) : displayedLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-2">
                                    <FileText className="w-12 h-12 text-gray-500" />
                                    <div className="text-gray-400 text-sm">No logs to show.</div>
                                    <div className="text-gray-600 text-xs">
                                        필터를 해제하거나 새로운 로그를 기다려보세요 =)
                                    </div>
                                </div>
                            ) : (
                                <div className={`${styles.logTextArea} px-6 py-4 text-[12.5px] font-DungGeunMo space-y-2`} style={{ userSelect: 'text' }}>
                                    {displayedLogs.map((log, idx) => (
                                        <div
                                            key={`${log.ts}-${idx}`}
                                            className={styles.logLine}
                                        >
                                            <span className={styles.time}>[{log.display}]</span>{' '}
                                            <span className={`${styles.badge} ${styles[`t_${log.type}`]}`}>{log.type}</span>{' '}
                                            <span className={styles.msg}>{log.message}</span>
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}