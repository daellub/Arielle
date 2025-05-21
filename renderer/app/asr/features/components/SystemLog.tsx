// app/asr/features/components/SystemLog.tsx
'use client'

import styles from './SystemLog.module.css'
import LogSearchBar from './LogSearchBar'

import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import { Clock, BarChart3, FileText } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip} from 'recharts'

interface LogEntry {
    timestamp: string
    type: 'PROCESS' | 'RESULT' | 'DB' | 'ERROR' | 'INFO'
    message: string
}

interface ChartDataPoint {
    name: string
    cl: number // 현재 활동 로그
    pl: number // 이전 활동 로그
}

export default function SystemLog() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [mountTime] = useState<string>(() => new Date().toISOString())

    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [now, setNow] = useState('')
    const logEndRef = useRef<HTMLDivElement>(null)
    const prevCountRef = useRef<number>(0)

    const [filterTypes, setFilterTypes] = useState<LogEntry['type'][]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
    const [isSearching, setxIsSearching] = useState(false)
    
    const toggleFilter = (type: LogEntry['type']) => {
        setFilterTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        )
    }

    const displayedLogs = useMemo(() => {
        const base = searchQuery ? filteredLogs : logs
        return base.filter(
            log => (filterTypes.length === 0 || filterTypes.includes(log.type)) &&
            log.message.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [logs, filteredLogs, searchQuery, filterTypes])

    function formatDate(raw: string) {
        const d = new Date(raw)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const mi = String(d.getMinutes()).padStart(2, '0')
        const ss = String(d.getSeconds()).padStart(2, '0')
    
        return `${yyyy}. ${mm}. ${dd}. ${hh}:${mi}:${ss}`
    }
    
    // 그래프 점수 계산
    function calculateScore(logs: LogEntry[]): number {
        let score = 0
        for (const log of logs) {
            switch (log.type) {
                case 'ERROR': score += 4; break
                case 'RESULT': score += 3; break
                case 'DB': score += 2; break
                case 'PROCESS': score += 2; break
                case 'INFO': score += 1; break
            }
        }
        return score
    }

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([])
            return
        }
        const id = setTimeout(async () => {
            try {
                const res = await axios.get('http://localhost:8000/asr/log-suggestions',
                    { params: { q: searchQuery } }
                )
                setSuggestions(res.data)
            } catch (e) {
                setSuggestions([])
            }
        }, 300)
        return () => clearTimeout(id)
    }, [searchQuery])

    const fetchLogs = async (q: string) => {
        const res = await axios.get('http://localhost:8000/asr/logs', {
            params: { query: q }
        })
        const formatted = res.data.map((log: any) => ({
            timestamp: formatDate(log.timestamp),
            type: log.type,
            message: log.message
        }))
        setFilteredLogs(formatted)
    }
    const handleSearch = () => fetchLogs(searchQuery)
    const handleSelect = (kw: string) => {
        setSearchQuery(kw)
        fetchLogs(kw)
    }

    useEffect(() => {
        if (searchQuery.trim()) return () => {}
    
        const fetchAll = async () => {
            try {
                const res = await axios.get('http://localhost:8000/asr/logs',
                    {
                        params: { limit: 100, since: mountTime }
                    }
                )
                const raw: LogEntry[] = res.data.reverse()
                const filtered = raw.filter(l => new Date(l.timestamp) >= new Date(mountTime))
                const formatted = filtered.map((log: any) => ({
                    timestamp: formatDate(log.timestamp),
                    type: log.type,
                    message: log.message
                }))
                setLogs(formatted)
            } catch (e) {
                setLogs([])
            }
        }
    
        fetchAll()
        const iv = setInterval(fetchAll, 3000)
        return () => clearInterval(iv)
    }, [searchQuery])
    
    useEffect(() => {
        if (logs.length === 0) {
            const pts: ChartDataPoint[] = []
            const nowDate = new Date()
            for (let i = 9; i >= 0; i--) {
                const d = new Date(nowDate.getTime() - i * 60_000) // 1분 간격
                const hh = String(d.getHours()).padStart(2, '0')
                const mm = String(d.getMinutes()).padStart(2, '0')
                pts.push({ name: `${hh}:${mm}`, cl: 0, pl: 0 })
            }
            setChartData(pts)
            return
        }

        const now = new Date()
        const nowKey = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

        const buckets: Record<string, LogEntry[]> = {}
        logs.forEach(log => {
            const d = new Date(log.timestamp)
            const key = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            ;(buckets[key] ??= []).push(log)
        })

        const thisScore = calculateScore(buckets[nowKey] ?? [])

        setChartData(prev => {
            const last = prev[prev.length - 1]
            if (last?.name === nowKey) {
                return prev.map(pt =>
                    pt.name === nowKey ? { ...pt, cl: thisScore } : pt
                )
            }

            const newPt: ChartDataPoint = {
                name: nowKey,
                cl: thisScore,
                pl: last ? last.cl : 0
            }

            const next = [...prev, newPt]
            if (next.length > 10) next.shift()
            return next
        })
    }, [logs])

    useEffect(() => {
        const iv = setInterval(() => {
            setNow(new Date().toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric', month: '2-digit',
                day: '2-digit', hour: '2-digit',
                minute: '2-digit', second: '2-digit',
                hour12: false,
            }))
        }, 1000)
        return () => clearInterval(iv)
    }, [])
    
    useEffect(() => {
        const prev = prevCountRef.current
        const curr = displayedLogs.length
        if (curr > prev && logEndRef.current) {
            const container = logEndRef.current.closest(`.${styles.scrollContainer}`)
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth',
                })
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
                                <div className="font-TheCircleM text-[12px] tracking-[-0.035em]">{now}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-7.5 h-7.5 text-black" />
                            <div>
                                <span className="text-xs text-black text-[13px]">Activities</span>
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
                        {['INFO', 'ERROR', 'PROCESS', 'DB', 'RESULT'].map((type) => (
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
                            {displayedLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-2">
                                    <FileText className="w-12 h-12 text-gray-500" />
                                    <div className="text-gray-400 text-sm">No logs to show.</div>
                                    <div className="text-gray-600 text-xs">
                                        로그가 없습니다. 필터를 해제하거나 새로운 로그를 기다려보세요.
                                    </div>
                                </div>
                            ) : (
                                <div className={`${styles.logTextArea} px-6 py-4 text-sm font-DungGeunMo space-y-3`} style={{ userSelect: 'text' }}>
                                    {isSearching
                                        ? [...Array(6)].map((_, i) => (
                                            <div key={i} className="h-[14px] bg-neutral-700 rounded animate-pulse w-[80%]" />
                                        ))
                                        : displayedLogs.map((log, idx) => (
                                            <div key={idx}>
                                                [{log.timestamp}] [{log.type}] {log.message}
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