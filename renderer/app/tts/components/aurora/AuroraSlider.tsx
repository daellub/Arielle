// app/tts/components/aurora/AuroraSlider.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './AuroraSlider.module.css'

interface Props {
    label?: string
    min?: number
    max?: number
    step?: number
    value: number
    onChange: (value: number) => void
}

export default function AuroraSlider({
    label,
    min = 0,
    max = 100,
    step = 1,
    value,
    onChange
}: Props) {
    const rangeRef = useRef<HTMLInputElement>(null)
    const rippleContainerRef = useRef<HTMLDivElement>(null)
    const [bubbleLeft, setBubbleLeft] = useState(0)
    const [showBubble, setShowBubble] = useState(false)
    const bubbleTimeout = useRef<NodeJS.Timeout | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value)
        onChange(val)

        if (rangeRef.current) {
            const range = rangeRef.current
            const percent = (val - min) / (max - min)
            const width = range.offsetWidth
            setBubbleLeft(percent * width)
        }

        setShowBubble(true)
        if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current)
        bubbleTimeout.current = setTimeout(() => setShowBubble(false), 1500)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!rippleContainerRef.current || !rangeRef.current) return
        const rect = rangeRef.current.getBoundingClientRect()
        const left = e.clientX - rect.left

        const ripple = document.createElement('span')
        ripple.className = styles.ripple
        ripple.style.left = `${left}px`
        ripple.style.top = `50%`

        rippleContainerRef.current.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
    }

    return (
        <div className={styles.sliderGroup}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.sliderWrapper}>
                <input
                    ref={rangeRef}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    className={`${styles.range} ${styles.rangeTrackActive}`}
                />
                <div ref={rippleContainerRef} className={styles.rippleContainer} />
                {showBubble && (
                    <div
                        className={styles.bubble}
                        style={{
                        left: `${bubbleLeft}px`,
                        opacity: showBubble ? 1 : 0,
                        }}
                    >
                        {value}
                    </div>
                )}
            </div>
        </div>
    )
}
