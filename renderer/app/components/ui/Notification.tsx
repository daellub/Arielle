// app/asr/features/components/Notification.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence} from 'motion/react'
import clsx from 'clsx'
import { useNotificationStore } from '@/app/store/useNotificationStore'

export default function Notification() {
    const { 
        current, // {id, message, type, duration}
        visible,
        hide,
        pause,
        resume,
        isPaused,
        nextIfAny,
    } = useNotificationStore()

    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        if (!current) return
        hovered ? pause() : resume()
    }, [hovered, current, pause, resume])

    // ESC 키를 눌렀을 때 닫기
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') hide()
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [hide])

    useEffect(() => {
        if (!visible) {
            // 다음 알림이 있으면 160ms 후에 표시
            const id = setTimeout(nextIfAny, 160)
            return () => clearTimeout(id)
        }
    }, [visible, nextIfAny])

    const colorClass = useMemo(() => {
        switch (current?.type) {
            case 'success':
                return 'bg-green-500'
            case 'error':
                return 'bg-red-500'
            case 'info':
                return 'bg-blue-500'
            default:
                return 'bg-gray-500'
        }
    }, [current?.type])

    const progressRef = useRef<HTMLDivElement | null>(null)
    const startedRef = useRef(false)

    useEffect(() => {
        if (!current || !visible) return
        const bar = progressRef.current
        if (!bar) return

        // 초기화
        startedRef.current = false
        bar.style.transition = 'none'
        bar.style.width = '100%'

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        void bar.offsetHeight // 강제 리플로우

        bar.style.transition = `width ${current.duration}ms linear`

        requestAnimationFrame(() => { bar.style.width = '0%' })

        startedRef.current = true
    }, [current?.id, visible])

    // 일시정지 / 재개 동기화
    useEffect(() => {
        if (!current || !visible) return
        if (!startedRef.current) return
        const bar = progressRef.current
        if (!bar) return

        if (isPaused) {
            const { remainingMs } = useNotificationStore.getState()
            const pct = Math.max(0, Math.min(100, (remainingMs / current.duration) * 100))
            bar.style.transition = 'none'
            bar.style.width = `${pct}%`
        } else {
            const { remainingMs } = useNotificationStore.getState()
             // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            bar.offsetWidth
            bar.style.transition = `width ${remainingMs}ms linear`
            requestAnimationFrame(() => { bar.style.width = '0%' })
        }
    }, [current, isPaused, visible])

    return (
        <div
            aria-live='polite'
            aria-atomic='true'
            className='fixed inset-x-0 bottom-8 z-[9999] pointer-events-none'
        >
            <AnimatePresence initial={false}>
                {visible && current && (
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        role="status"
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        className={clsx(
                            'mx-auto w-fit min-w-[220px] max-w-[80vw]',
                            'px-4 py-3 rounded-xl shadow-xl text-center text-white font-semibold text-sm',
                            'pointer-events-auto select-none',
                            colorClass
                        )}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        {/* 메시지 */}
                        <div className='px-1 py-0.5'>{current.message}</div>

                        {/* 진행바 */}
                        <div className='mt-2 h-[3px] w-full bg-white/20 rounded overflow-hidden'>
                            <div
                                ref={progressRef}
                                className='h-full bg-white/90'
                                style={{
                                    width: '100%',
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}