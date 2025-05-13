// app/llm/features/components/SectionTimerCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export default function SessionTimerCard() {
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    useEffect(() => {
        const start = Date.now()

        const interval = setInterval(() => {
            const now = Date.now()
            const elapsed = Math.floor((now - start) / 1000)
            setElapsedSeconds(elapsed)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60)
        const sec = seconds % 60
        return `${min}분 ${sec < 10 ? `0${sec}` : sec}초`
    }

    return (
        <div className="w-[260px] p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm text-white flex items-center justify-between">
            <div className="text-[13px] text-white/70 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-200" />
                세션 시간
            </div>
            <div className="text-white font-semibold text-[13px]">{formatTime(elapsedSeconds)}</div>
        </div>
    )
}
