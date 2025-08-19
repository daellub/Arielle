// app/common/toast/ToastContainer.tsx

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useToastStore, ToastItem } from './useToastStore'
import { CheckCircle2, Info, AlertTriangle, XCircle, Dot } from 'lucide-react'

const AURORA_FROM = '#d3c3fc'
const AURORA_TO = '#9ac5fc'

function useNow() {
    const [n, setN] = useState(() => Date.now())
    useEffect(() => {
        const t = setInterval(() => setN(Date.now()), 100)
        return () => clearInterval(t)
    }, [])
    return n
}

function ToastCard({ t }: { t: ToastItem }) {
    const remove = useToastStore((s) => s.remove)
    const [hover, setHover] = useState(false)

    // 타이머 관련
    const startedAt = useRef<number>(performance.now())
    const consumedMs = useRef(0)
    const timeoutRef = useRef<number | null>(null)

    const total = t.duration ?? 3500

    const getAuroraPair = (variant?: ToastItem['variant']) => {
        switch (variant) {
            case 'success': return ['#d1fae5', '#34d399'] // emerald-100 <-> 400
            case 'info':    return ['#dbeafe', '#3b82f6'] // blue-100 <-> 500
            case 'warning': return ['#fef3c7', '#f59e0b'] // amber-100 <-> 500
            case 'danger':  return ['#fee2e2', '#ef4444'] // red-100 <-> 500
            default:        return [AURORA_FROM, AURORA_TO]
        }
    }
    const [C1, C2] = getAuroraPair(t.variant)

    const dur1 = useMemo(() => `${(Math.random() * 1.0 + 2.0).toFixed(2)}s`, [])
    const dur2 = useMemo(() => `${(Math.random() * 1.2 + 2.4).toFixed(2)}s`, [])
    const del1 = useMemo(() => `${(Math.random() * 0.6).toFixed(2)}s`, [])
    const del2 = useMemo(() => `${(Math.random() * 0.6).toFixed(2)}s`, [])

    const scheduleClose = (ms: number) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        if (!t.duration) return
        timeoutRef.current = window.setTimeout(() => remove(t.id), Math.max(0, ms))
    }

    useEffect(() => {
        if (t.duration) scheduleClose(total)
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onEnter = () => {
        setHover(true)
        consumedMs.current += performance.now() - startedAt.current
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    const onLeave = () => {
        setHover(false)
        startedAt.current = performance.now()
        const remain = Math.max(0, total - consumedMs.current)
        scheduleClose(remain)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            role="status"
            aria-live="polite"
            className={t.compact ? 'pointer-events-auto w-[300px] max-w-[92vw]' : 'pointer-events-auto w-[360px] max-w-[92vw]'}
        >
            <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-1 ${
                t.variant === 'success' ? 'ring-emerald-400/40'
                : t.variant === 'info' ? 'ring-blue-400/40'
                : t.variant === 'warning' ? 'ring-amber-400/40'
                : t.variant === 'danger' ? 'ring-red-400/40'
                : 'ring-slate-300/30'
            }`}>
                {/* 좌측 오로라 라인 */}
                <div
                    className="absolute inset-y-0 left-0 w-1.5 will-change-transform"
                    style={{
                        background: `linear-gradient(180deg, ${C1} 0%, ${C1} 46%, ${C2} 54%, ${C2} 100%)`,
                        backgroundSize: '100% 300%',
                        animationName: 'auroraFlowY',
                        animationDuration: '6s',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationPlayState: 'running',
                        filter: 'saturate(1.15) brightness(1.15)',
                        boxShadow: `0 0 18px ${C1}22 inset, 0 0 20px ${C2}22`
                    }}
                />

                <div className="pointer-events-none absolute inset-0 noise-mask opacity-[.07]" />

                <div className={t.compact ? 'pl-4 pr-3 py-2 flex items-start gap-2.5' : 'pl-4 pr-3 py-3 sm:pl-5 sm:pr-4 flex items-start gap-3'}>
                    <div className="mt-0.5 text-white/90">
                        {t.variant === 'success' ? <CheckCircle2 className="size-5" />
                        : t.variant === 'info' ? <Info className="size-5" />
                        : t.variant === 'warning' ? <AlertTriangle className="size-5" />
                        : t.variant === 'danger' ? <XCircle className="size-5" />
                        : <Dot className="size-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* 제목 */}
                        {t.title && (
                            <div className="font-semibold text-white/95 tracking-[.01em]">
                                <span className="glitch" data-text={t.title}>{t.title}</span>
                            </div>
                        )}

                        {/* 설명 */}
                        {t.description && (
                            <div className="text-sm/5 text-white/85 mt-0.5">
                                {t.description}
                            </div>
                        )}

                        {/* 액션 버튼 */}
                        {t.actionText && t.onAction && (
                            <button
                                onClick={t.onAction}
                                className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-white/15 hover:bg-white/25 text-white/95 focus:outline-none focus:ring-2 focus:ring-white/40"
                            >
                                {t.actionText}
                            </button>
                        )}
                    </div>

                    {/* 닫기 */}
                    {t.dismissible !== false && (
                        <button
                            aria-label="닫기"
                            onClick={() => remove(t.id)}
                            className="shrink-0 rounded-md p-1.5 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* 진행 바 */}
                {t.duration && (
                    <div className="relative h-0.5 w-full bg-white/10 overflow-hidden rounded-sm">
                        <div
                            className="h-full will-change-transform"
                            style={{
                                transformOrigin: 'left center',
                                animationName: 'toastProgress, auroraFlowX',
                                animationDuration: `${total}ms, 6s`,
                                animationTimingFunction: 'linear, linear',
                                animationIterationCount: `1, infinite`,
                                animationFillMode: 'both, both',
                                animationPlayState: hover ? ('paused, paused' as const) : ('running, running' as const),
                                background: `linear-gradient(90deg, ${AURORA_FROM}, ${AURORA_TO})`,
                                backgroundSize: '200% 200%',
                                boxShadow: `0 0 12px ${AURORA_TO}66, 0 0 20px ${AURORA_FROM}55 inset`,
                            }}
                        />
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes toastProgress {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
                @keyframes auroraFlowX {
                    0%   { background-position:   0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position:   0% 50%; }
                }
                @keyframes auroraFlowY {
                    0%   { background-position: 0%   0%; }
                    50%  { background-position: 0% 100%; }
                    100% { background-position: 0%   0%; }
                }
                .noise-mask {
                    background-image: url("data:image/svg+xml;utf8,\
                        <svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>\
                        <filter id='n'>\
                            <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/>\
                            <feColorMatrix type='saturate' values='0'/>\
                            <feComponentTransfer><feFuncA type='table' tableValues='0 0 0 0 0.8 0 0 0 0 0'/></feComponentTransfer>\
                        </filter>\
                        <rect width='100%' height='100%' filter='url(%23n)'/>\
                        </svg>");
                    background-size: 140px 140px;
                    mix-blend-mode: overlay;
                }
                .glitch { position: relative; display: inline-block; }
                .glitch::before,
                .glitch::after {
                    content: attr(data-text);
                    position: absolute; left: 0; top: 0;
                    width: 100%; height: 100%;
                    pointer-events: none;
                    mix-blend-mode: screen;
                    opacity: 0.06;
                }
                .glitch::before { transform: translate3d(-0.5px, -0.2px, 0); color: ${AURORA_FROM}; }
                .glitch::after  { transform: translate3d( 0.5px,  0.2px, 0); color: ${AURORA_TO}; }
                @media (prefers-reduced-motion: reduce) {
                    .noise-mask { display: none; }
                }
            `}</style>
        </motion.div>
    )
}

export default function ToastContainer() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const toasts = useToastStore((s) => s.toasts)
    if (typeof window === 'undefined') return null

    const node = (
        <div
            aria-live="polite"
            className="pointer-events-none fixed z-[10000] inset-0 flex flex-col-reverse items-end gap-2 p-4 sm:p-6"
        >
            <AnimatePresence initial={false}>
                {toasts.map((t) => (
                    <ToastCard key={t.id} t={t} />
                ))}
            </AnimatePresence>
        </div>
    )

    if (!mounted) return null

    return createPortal(node, document.body)
}
