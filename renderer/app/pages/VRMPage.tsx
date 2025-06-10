// app/pages/VRMPage.tsx
'use client'

import VRMMemoryPlayer from '@/app/vrm/components/VRMMemoryPlayer'
import styles from './VRMPage.module.css'
import { Sparkles } from 'lucide-react'

import React, { useState } from 'react';
import VRMSceneLayer from '../vrm/components/VRMOverlayLayer'
import MemoryLoadingBar from '../vrm/components/MemoryLoadingBar'
import VRMEmotionPanel from '../vrm/components/VRMEmotionPanel'
import VRMViewerModel from '../vrm/components/VRMViewerModel';

export default function VRMPage() {
    const [viewerKey, setViewerKey] = useState(0)

    const handleReload = () => setViewerKey((prev) => prev + 1)
    
    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.leftPanel}>
                    {/* <VRMViewerModel key={viewerKey} /> */}
                    <VRMSceneLayer />
                    <MemoryLoadingBar trigger={0} />
                    <VRMMemoryPlayer />
                </div>
                <div className={styles.rightPanel}>
                    <div className={styles.dataPanel}>
                        <h1 className={styles.title}>
                            01<br /><span>ARIELLE</span>
                        </h1>
                        <p className={styles.subtitle}>from the forest protocol</p>

                        <VRMEmotionPanel />

                        <button onClick={handleReload} style={{ marginTop: '24px', padding: '6px 12px', fontSize: '0.8rem' }}>
                            🔁 Reload VRM
                        </button>

                        <div className={styles.symbols}>
                            <Sparkles size={14} />
                            <span>🞄 🞁 🞂</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
