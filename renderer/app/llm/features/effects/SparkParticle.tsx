// app/llm/features/effects/SparkParticle.tsx
import React from 'react'
import styles from '@/app/styles/SparkEffect.module.css'

interface SparkParticleProps {
    top: string
    left: string
    size: string
    delay: string
    duration: string
}

export default function SparkParticle({ top, left, size, delay, duration }: SparkParticleProps) {
    return (
        <div
            className={styles['spark-particle']}
            style={{
                top,
                left,
                width: size,
                height: size,
                animationDelay: delay,
                animationDuration: duration,
                backgroundColor: 'rgba(255, 240, 180, 0.2)',
                filter: 'blur(6px)',
                opacity: 0.4,
            }}
        />
    )
}
