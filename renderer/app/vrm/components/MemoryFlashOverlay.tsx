// app/vrm/components/MemoryFlashOverlay.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './MemoryFlashOverlay.module.css'

export default function MemoryFlashOverlay({ onComplete }: { onComplete?: () => void }) {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false)
            onComplete?.()
        }, 1000) // 1초 플래시

        return () => clearTimeout(t)
    }, [])

    if (!visible) return null
    return <div className={styles.flash} />
}
