'use client'

import styles from './ParallaxText.module.css'
import { useParallaxEffect } from '@/app/vrm/hooks/useParallaxEffect'

export default function ParallaxText() {
    useParallaxEffect()
    return (
        <div className={styles.parallaxText} data-parallax>
            ↳ SYSTEM SYNC: 92.3%
        </div>
    )
}
