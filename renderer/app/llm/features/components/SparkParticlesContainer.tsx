// app/llm/features/components/SparkParticlesContainer.tsx
'use client'

import React, { memo, useMemo } from 'react'
import styles from '@/app/styles/SparkEffect.module.css'


type Props = {
    count?: number
    seed?: number
    className?: string
}

function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function SparkParticlesContainer({ count = 24, seed = 1337, className }: Props) {
    const particles = useMemo(() => {
        const rnd = mulberry32(seed)
        return Array.from({ length: count }, (_, i) => {
            const top = `${Math.floor(rnd() * 100)}%`
            const left = `${Math.floor(rnd() * 100)}%`
            const size = `${6 + Math.floor(rnd() * 7)}px`
            const delay = `${(rnd() * 5).toFixed(2)}s`
            const dur = `${(5 + rnd() * 5).toFixed(2)}s`
            const amp = `${12 + Math.floor(rnd() * 18)}px`
            return { key: i, top, left, size, delay, dur, amp }
        })
    }, [count, seed])

    return (
        <div className={`${styles.container} ${className ?? ''}`}>
            {particles.map((p) => (
                <span
                    key={p.key}
                    className={styles.spark}
                    style={{
                        ['--y' as any]: p.top,
                        ['--x' as any]: p.left,
                        ['--size' as any]: p.size,
                        ['--delay' as any]: p.delay,
                        ['--dur' as any]: p.dur,
                        ['--amp' as any]: p.amp,
                    }}
                />
            ))}
        </div>
    )
}

export default memo(SparkParticlesContainer)
