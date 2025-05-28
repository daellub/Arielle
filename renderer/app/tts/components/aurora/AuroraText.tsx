// app/tts/components/aurora/AuroraText.tsx
'use client'

import React from 'react'
import styles from './AuroraText.module.css'

interface Props {
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
    glitch?: boolean
    blur?: boolean
}

export default function AuroraText({ children, size = 'md', glitch = false, blur = false }: Props) {
    return (
        <div className={`${styles.auroraText} ${styles[size]} ${glitch ? styles.glitch : ''} ${blur ? styles.blur : ''}`}>
            <span className={styles.red}>{children}</span>
            <span className={styles.blue}>{children}</span>
            <span className={styles.main}>{children}</span>
        </div>
    )
}
