// app/llm/features/components/SparkParticlesContainer.tsx
import React, { useEffect, useState } from 'react'
import SparkParticle from '../effects/SparkParticle'
import styles from '@/app/styles/SparkEffect.module.css'

interface ParticleData {
    top: string
    left: string
    size: string
    delay: string
    duration: string
}

export default function SparkParticlesContainer() {
    const [particles, setParticles] = useState<ParticleData[]>([])

    useEffect(() => {
        const generated = Array.from({ length: 25 }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 4 + 6}px`,
            delay: `${Math.random() * 5}s`,
            duration: `${5 + Math.random() * 5}s`,
        }))
        setParticles(generated)
    }, [])

    return (
        <div className={styles['spark-container']}>
            {particles.map((p, i) => (
                <SparkParticle key={i} {...p} />
            ))}
        </div>
    )
}
