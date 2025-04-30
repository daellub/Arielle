// app/features/asr/components/SystemLog.tsx
'use client'

import { useState } from 'react'

interface LogEntry {
    timestamp: string
    type: 'PROCESS' | 'RESULT' | 'DB' | 'ERROR' | 'INFO' | 'EXAMPLE'
    message: string
}

const initialLogs: LogEntry[] = [
    { timestamp: '02:34', type: 'PROCESS', message: 'Processing Audio Recognize...' },
    { timestamp: '02:35', type: 'PROCESS', message: 'Listening Audio. . . . .' },
    { timestamp: '02:35', type: 'RESULT', message: 'Audio Transcribe Successful! (language="KO")' },
    { timestamp: '02:36', type: 'DB', message: 'Saving Result Metadata in DB' },
    { timestamp: '02:37', type: 'EXAMPLE', message: '예시 로그 데이터입니다. 와랄랄라' },
]

export default function SystemLog() {
    const [logs] = useState<LogEntry[]>(initialLogs)

    return (
        <div className="bg-white shadow-md rounded-[32px] p-5 w-[640px] h-[320px] mt-5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-black font-semibold">Log</h3>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="px-2 py-1 bg-black text-white rounded-full">+{logs.length}</span>
                    {/* <span>{new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</span> */}
                </div>
            </div>
            <div className="bg-black text-white rounded-lg p-4 h-[180px] overflow-y-auto text-sm font-mono space-y-1">
                {logs.map((log, idx) => (
                    <div key={idx}>
                        [{log.timestamp}] [{log.type}] {log.message}
                    </div>
                ))}
            </div>
        </div>
    )
}