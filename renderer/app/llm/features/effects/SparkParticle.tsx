// app/llm/features/effects/SparkParticle.tsx
import React, { memo } from 'react'
import styles from '@/app/styles/SparkEffect.module.css'

interface SparkParticleProps {
    top: string
    left: string
    size: string
    delay: string
    duration: string
    amp?: string
}
export default memo(function SparkParticle({
    top, left, size, delay, duration, amp = '18px',
}: SparkParticleProps) {
    return (
        <span
            className={styles.spark}
            style={{
                ['--y' as any]: top,
                ['--x' as any]: left,
                ['--size' as any]: size,
                ['--delay' as any]: delay,
                ['--dur' as any]: duration,
                ['--amp' as any]: amp,
            }}
        />
    )
})