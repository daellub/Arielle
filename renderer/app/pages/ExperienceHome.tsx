// app/pages/HomePage.tsx
/**
 * Arielle 프로젝트의 실험 버전으로 개발 중인 테마 기능입니다.
 */
'use client'

import { useEffect } from 'react'
import DepthRoot from '@/app/components/DepthRoot'
import HomeHero from '@/app/home/HomeHero'
import { useDepthTheme } from '@/app/theme/useDepthTheme'

export default function HomePage() {
    const setDepth = useDepthTheme((s) => s.setDepth)

    useEffect(() => {
        // 수면이지만 밤이라 너무 밝지 않게 0.10 정도
        setDepth(0.10)
        return () => setDepth(0.10)
    }, [setDepth])

    return (
        <DepthRoot preset="night">
            <HomeHero />
        </DepthRoot>
    )
}