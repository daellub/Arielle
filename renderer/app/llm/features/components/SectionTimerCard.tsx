// app/llm/features/components/SectionTimerCard.tsx
'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Clock } from 'lucide-react'
import clsx from 'clsx'

interface Props {
    startAt?: number
    className?: string
}

export default function SessionTimerCard({ startAt, className }: Props) {
    const startRef = useRef<number>(startAt ?? Date.now())
    const [seconds, setSeconds] = useState<number>(() =>
        Math.floor((Date.now() - startRef.current) / 1000)
    )
    const toRef = useRef<number | null>(null)

    const schedule = () => {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
        const now = Date.now()
        const nextIn = 1000 - (now % 1000)
        toRef.current = window.setTimeout(schedule, nextIn)
    }

    useEffect(() => {
        const now = Date.now()
        const first = 1000 - (now % 1000)
        toRef.current = window.setTimeout(schedule, first)

        const onVisibility = () => {
            if (document.hidden) {
                if (toRef.current) {
                    clearTimeout(toRef.current)
                    toRef.current = null
                }
            } else {
                schedule()
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('focus', onVisibility)

        return () => {
            if (toRef.current) clearTimeout(toRef.current)
            document.removeEventListener('visibilitychange', onVisibility)
            window.removeEventListener('focus', onVisibility)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const label = useMemo(() => {
        const s = seconds
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = s % 60
        if (h > 0) {
            return `${h}시간 ${String(m).padStart(2, '0')}분 ${String(sec).padStart(2, '0')}초`
        }
        return `${m}분 ${String(sec).padStart(2, '0')}초`
    }, [seconds])

    return (
        <div
            className={clsx(
                'w-[260px] p-4 rounded-2xl',
                'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md',
                'border border-white/10 shadow-[0_8px_24px_rgba(120,100,200,0.15)]',
                'text-white flex items-center justify-between',
                className
            )}
        >
            <div className="text-[13px] text-white/70 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-200" />
                세션 시간
            </div>
            <div
                className="text-[13px] font-semibold tabular-nums px-2 py-0.5 rounded-md bg-white/10 ring-1 ring-white/10"
                aria-live="off"
                title={label}
            >
                {label}
            </div>
        </div>
    )
}
