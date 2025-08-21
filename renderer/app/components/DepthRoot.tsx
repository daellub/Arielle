// app/components/DepthRoot.tsx
/**
 * Arielle 프로젝트의 실험 버전으로 개발 중인 테마 기능입니다.
 */
'use client'
import { useMemo } from 'react'
import { useDepthTheme } from '@/app/theme/useDepthTheme'
import clsx from 'clsx'

type Preset = 'day' | 'night'

export default function DepthRoot({ children, preset = 'night' }: { children: React.ReactNode; preset?: Preset }) {
    const depth = useDepthTheme((s) => s.depth)

    const vars = useMemo(() => {
        const lerp = (a: number, b: number) => a + (b - a) * depth

        const topNight = `hsl(210 60% ${lerp(22, 10)}%)`
        const bottomNight = `hsl(225 70% ${lerp(10, 4)}%)`
        const topDay = `hsl(200 100% ${lerp(80, 18)}%)`
        const bottomDay = `hsl(212 100% ${lerp(64, 6)}%)`

        const top = preset === 'night' ? topNight : topDay
        const bottom = preset === 'night' ? bottomNight : bottomDay

        return {
            '--bg-top': top,
            '--bg-bottom': bottom,
            '--fog': String(0.10 + 0.35 * depth),
            '--glow': String(0.35 + 0.65 * depth),
            '--ray': String(preset === 'night' ? 0.18 : 0.28),
            '--stars': String(0.35 + 0.35 * (1 - depth)),

            // ✨ 수평선 Y 위치(화면 하단 기준 %). 깊어질수록 약간 내려가게.
            '--horizon-y': `${Math.round(lerp(46, 40))}%`,

            // 잔물결 강도(0~1)
            '--sea-state': String(lerp(0.25, 0.55)),
        } as React.CSSProperties
    }, [depth, preset])

    return (
        <div style={vars as any} className="min-h-screen relative overflow-x-hidden">
            {/* 배경 그라데이션 */}
            <div className="fixed inset-0 -z-30"
                 style={{ background: 'linear-gradient(var(--bg-top), var(--bg-bottom))' }} />

            {/* 별 */}
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 ocean-stars"
                 style={{ opacity: 'var(--stars)' }} />
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 ocean-stars2"
                 style={{ opacity: 'calc(var(--stars) * 0.6)' }} />

            {/* 상단 달빛 글로우 */}
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-19 ocean-horizon" />

            {/* ✅ 수평선 라인/글로우/리플 */}
            <div aria-hidden className="pointer-events-none fixed inset-x-0 -z-19 ocean-horizon-glow"
                 style={{ bottom: 'var(--horizon-y)' }} />
            <div aria-hidden className="pointer-events-none fixed inset-x-0 h-px -z-19 ocean-horizon-line"
                 style={{ bottom: 'var(--horizon-y)' }} />
            <div aria-hidden className="pointer-events-none fixed inset-x-0 -z-19 ocean-ripples"
                 style={{ bottom: 'calc(var(--horizon-y) - 8px)' }} />

            {/* 서치라이트 */}
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-18 ocean-night-rays"
                 style={{ opacity: 'var(--ray)' }} />

            {/* 비네트/포그 */}
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-10"
                 style={{
                     background: 'radial-gradient(115% 160% at 50% 120%, rgba(3,10,20,var(--fog)), transparent 45%)',
                 }} />

            {children}
        </div>
    )
}