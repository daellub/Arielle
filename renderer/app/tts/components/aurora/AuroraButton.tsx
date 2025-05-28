// app/tts/components/aurora/AuroraButton.tsx
'use client'

import { motion } from 'framer-motion'
import styles from './AuroraButton.module.css'
import { ReactNode } from 'react'

interface Props {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
}

export default function AuroraButton({ children, onClick, disabled = false, className = '' }: Props) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: 0.96 }}
            className={`${styles.button} ${disabled ? styles.disabled : ''} ${className}`}
        >
            <span className={styles.glow} />
            <span className={styles.content}>{children}</span>
        </motion.button>
    )
}
