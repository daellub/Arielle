// app/components/common/FadeInSection.tsx
'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface Props {
    children: React.ReactNode
    delay?: number
    yOffset?: number
    className?: string
}

export default function FadeInSection({
    children,
    delay = 0.1,
    yOffset = 20,
    className = ''
}: Props) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' })
    const controls = useAnimation()

    useEffect(() => {
        if (inView) {
            controls.start('visible')
        }
    }, [inView, controls])

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={controls}
            transition={{ duration: 0.6, delay }}
            variants={{
                hidden: { opacity: 0, y: yOffset, filter: 'blur(8px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
            }}
        >
            {children}
        </motion.div>
    )
}
