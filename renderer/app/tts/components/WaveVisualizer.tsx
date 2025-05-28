// app/tts/components/WaveVisualizer.tsx
'use client'

import styles from './WaveVisualizer.module.css'

export default function WaveVisualizer({ active = false }: { active?: boolean }) {
    const barCount = 24
    const bars = Array.from({ length: barCount })

    return (
        <div className={styles.wrapper}>
            {bars.map((_, i) => (
                <div
                    key={i}
                    className={`${styles.bar} ${active ? styles.active : ''}`}
                    style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}
                />
            ))}
        </div>
    )
}
