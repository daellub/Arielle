'use client'

import { useState } from 'react'
import { FileText, AlertTriangle, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface LogEntry {
    timestamp: string
    type: 'INFO' | 'ERROR' | 'PROCESS' | 'RESULT'
    source: 'FRONTEND' | 'BACKEND' | 'MODEL' | 'DB'
    message: string
}

const dummyLogs: LogEntry[] = [
    {
        timestamp: '14:00:01',
        type: 'INFO',
        source: 'MODEL',
        message: 'MCP context initialized for session #4521'
    },
    {
        timestamp: '14:00:05',
        type: 'PROCESS',
        source: 'MODEL',
        message: 'Injected context prompt: "You are a helpful assistant."'
    },
    {
        timestamp: '14:00:08',
        type: 'RESULT',
        source: 'DB',
        message: 'Saved context memory block (id=CTX1023)'
    },
    {
        timestamp: '14:00:10',
        type: 'ERROR',
        source: 'MODEL',
        message: 'Failed to resolve dynamic variable: {persona}'
    },
    {
        timestamp: '14:00:15',
        type: 'PROCESS',
        source: 'BACKEND',
        message: 'Context binding complete for LLM pipeline'
    },
    {
        timestamp: '14:00:19',
        type: 'INFO',
        source: 'MODEL',
        message: 'Registered tool: "PersonaAnalyzer-v1"'
    },
    {
        timestamp: '14:00:22',
        type: 'RESULT',
        source: 'DB',
        message: 'Stored 3 context prompts to persistent memory'
    }
]

function getLogIcon(type: LogEntry['type']) {
    switch (type) {
        case 'INFO': return <FileText className="w-4 h-4 text-white/60" />
        case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-400" />
        case 'PROCESS': return <Loader2 className="w-4 h-4 text-indigo-400" />
        case 'RESULT': return <CheckCircle2 className="w-4 h-4 text-green-400" />
    }
}
function getColor(type: LogEntry['type']) {
    return {
        INFO: 'text-white/80',
        ERROR: 'text-red-400',
        PROCESS: 'text-indigo-300',
        RESULT: 'text-green-300'
    }[type]
}

export default function LogsPanel() {
    const [logs] = useState<LogEntry[]>(dummyLogs)

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 font-semibold text-white">
                <Clock className="w-4 h-4 text-white/70" />
                Logs
            </div>

            <div className="space-y-2 text-sm max-h-[400px] overflow-y-auto pr-1">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <div className="pt-0.5">{getLogIcon(log.type)}</div>

                        <div className="flex flex-col text-[12px]">
                            <div className={clsx('flex gap-2 font-mono', getColor(log.type))}>
                                <span className="w-[60px]">{log.timestamp}</span>
                                <span className="w-[80px]">{log.source}</span>
                                <span className="w-[70px]">{log.type}</span>
                            </div>
                            <div className="text-white/60 leading-snug">{log.message}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
