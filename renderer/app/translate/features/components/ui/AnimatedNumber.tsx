// app/translate/features/components/ui/AnimatedNumber.tsx
'use client'

import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import { useEffect } from 'react'

export default function AnimatedNumber({ value }: { value: number }) {
    const motionValue = useMotionValue(0)
    const rounded = useTransform(motionValue, (latest) => latest.toFixed(1))

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 2,
            ease: 'easeOut',
        })

        return controls.stop
    }, [value])

    return (
        <motion.span>
            {rounded}
        </motion.span>
    )
}
