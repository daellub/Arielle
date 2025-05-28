// app/vrm/components/VRMMemoryPlayer.tsx
'use client'

import { useState } from 'react'
import MemoryFlashOverlay from './MemoryFlashOverlay'
import MemoryLoadingBar from './MemoryLoadingBar'
import { useParallaxEffect } from '@/app/vrm/hooks/useParallaxEffect'
import styles from './VRMMemoryPlayer.module.css'

export default function VRMMemoryPlayer() {
    useParallaxEffect()
    
    const [isFlash, setIsFlash] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isPlayed, setIsPlayed] = useState(false)
    const [loadingKey, setLoadingKey] = useState(0)

    const handleStart = () => {
        setIsFlash(true)
        setLoadingKey(prev => prev + 1) 
    }

    const handleFlashComplete = () => {
        setIsFlash(false)
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setIsPlayed(true)
        }, 2000)
    }

    return (
        <div className={styles.player}>
            {isFlash && <MemoryFlashOverlay onComplete={handleFlashComplete} />}
            {isLoading && <MemoryLoadingBar trigger={loadingKey} />}
        </div>
    )
}
