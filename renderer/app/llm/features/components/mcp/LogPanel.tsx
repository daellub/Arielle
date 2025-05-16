'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Clock, FileText, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

interface LogEntry {
    timestamp: string
    type: 'INFO' | 'ERROR' | 'PROCESS' | 'RESULT'
    source: string
    message: string
}

function getLogIcon(type: LogEntry['type']) {
    switch (type) {
        case 'INFO':    return <FileText className="w-4 h-4 text-white/60" />
        case 'ERROR':   return <AlertTriangle className="w-4 h-4 text-red-400" />
        case 'PROCESS': return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
        case 'RESULT':  return <CheckCircle2 className="w-4 h-4 text-green-400" />
    }
}

function getColor(type: LogEntry['type']) {
    return {
        INFO:    'text-white/80',
        ERROR:   'text-red-400',
        PROCESS: 'text-indigo-300',
        RESULT:  'text-green-300'
    }[type]
}

export default function LogsPanel() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())

    const toggleExpanded = (index: number) => {
        setExpandedLogs(prev => {
            const copy = new Set(prev)
            copy.has(index) ? copy.delete(index) : copy.add(index)
            return copy
        })
    }

    useEffect(() => {
        axios.get('http://localhost:8500/mcp/api/logs')
            .then(res => setLogs(res.data))
            .catch(err => console.error('로그 불러오기 실패:', err))
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold text-white">
                <Clock className="w-4 h-4 text-white/70" />
                <span>Logs</span>
            </div>

            <div className="scrollLLMArea space-y-2 text-sm max-h-[360px] overflow-y-auto pr-1 overflow-x-hidden">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <div className="pt-0.5">{getLogIcon(log.type)}</div>
                        <div className="flex flex-col text-[12px]">
                            <div className={clsx('flex gap-2 font-mono', getColor(log.type))}>
                                <span className="w-[60px]">{log.timestamp}</span>
                                <span className="w-[80px]">{log.source}</span>
                                <span className="w-[70px]">{log.type}</span>
                            </div>
                            <div
                                className={clsx(
                                    "text-white/60 leading-snug break-all cursor-pointer transition-all duration-200",
                                    !expandedLogs.has(i) && "line-clamp-2"
                                )}
                                onClick={() => toggleExpanded(i)}
                            >
                                {log.message}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
