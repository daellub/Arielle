// app/shared/Jelly.tsx
'use client'
import { motion } from 'motion/react'

type Props = {
    src: string
    width?: number
    x?: string
    y?: string
    delay?: number
    speed?: number
    opacity?: number
}

export default function Jelly({
    src,
    width = 220,
    x = '40%',
    y = '30%',
    delay = 0,
    speed = 18,
    opacity = 0.8,
}: Props) {
    return (
        <motion.img
            src={src}
            width={width}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                opacity,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
            }}
            initial={{ y: 0 }}
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut', delay }}
        />
    )
}
