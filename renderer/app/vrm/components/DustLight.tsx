// app/vrm/components/DustLight.tsx
'use client'

import { useMemo } from 'react'
import styles from './DustLight.module.css'

interface Particle {
    x: number
    y: number
    size: number
    duration: number
    delay: number
}

export default function DustLight({ count = 20 }: { count?: number }) {
    const particles = useMemo<Particle[]>(() =>
        Array.from({ length: count }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            duration: Math.random() * 5 + 5,
            delay: Math.random() * 5,
        })), [count]
    )

    return (
        <div className={styles.container}>
            {particles.map((p, i) => (
                <div
                    key={i}
                    className={styles.particle}
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    )
}
