// app/translate/features/components/ui/AnimatedNumber.tsx
'use client'

import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

type AnimatedNumberProps = {
    value: number
    decimals?: number
    duration?: number
    ease?: Parameters<typeof animate>[2] extends infer T ? T extends { ease?: infer E } ? E : any : any
    animateFromPrev?: boolean
    prefix?: string
    suffix?: string
}

export default function AnimatedNumber({
    value,
    decimals = 1,
    duration = 0.6,
    ease = 'easeOut',
    animateFromPrev = true,
    prefix = '',
    suffix = '',
}: AnimatedNumberProps) {
    const shouldReduce = useReducedMotion()
    const mv = useMotionValue(animateFromPrev ? 0 : value)
    const prevRef = useRef<number>(animateFromPrev ? 0 : value)

    const formatted = useTransform(mv, (latest) => {
        const fmt = new Intl.NumberFormat(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
        return fmt.format(latest)
    })

    useEffect(() => {
        if (value === prevRef.current) return

        if (shouldReduce) {
            mv.set(value)
            prevRef.current = value
            return
        }

        if (animateFromPrev) {
            const controls = animate(mv, value, { duration, ease })
            prevRef.current = value
            return () => controls.stop()
        } else {
            mv.set(0)
            const controls = animate(mv, value, { duration, ease })
            prevRef.current = value
            return () => controls.stop()
        }
    }, [value, duration, ease, animateFromPrev, shouldReduce, mv])

    const [displayValue, setDisplayValue] = useState<string>(() => formatted.get())

    useEffect(() => {
        const unsubscribe = formatted.on('change', (v) => setDisplayValue(v))
        return () => unsubscribe()
    }, [formatted])

    return (
        <motion.span aria-label={`${prefix}${value}${suffix}`}>
            {prefix}
            {displayValue}
            {suffix}
        </motion.span>
    )
}
