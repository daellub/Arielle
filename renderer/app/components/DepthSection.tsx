// app/components/DepthSection.tsx
/**
 * Arielle 프로젝트의 실험 버전으로 개발 중인 테마 기능입니다.
 */
'use client'

import { useRef } from 'react'
import { useScroll } from 'motion/react'
import { useDepthTheme } from '@/app/theme/useDepthTheme'

export default function DepthSection({
    children, height = '200vh', mapToDepth = true,
}: { children: React.ReactNode; height?: string; mapToDepth?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
    const setDepth = useDepthTheme((s) => s.setDepth)

    if (mapToDepth) scrollYProgress.on('change', (v) => setDepth(v)) // 0~1

    return (
        <section ref={ref} style={{ height }} className="relative">
            <div className="sticky top-0 min-h-screen">{children}</div>
        </section>
    )
}