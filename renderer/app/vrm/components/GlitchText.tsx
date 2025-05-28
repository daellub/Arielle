// app/vrm/components/GlitchText.tsx
'use client'

import styles from './GlitchText.module.css'

interface Props {
    text: string
    className?: string
}

export default function GlitchText({ text, className }: Props) {
    return (
        <span className={styles.glitch} data-text={text}>
            {text}
        </span>
    )
}
