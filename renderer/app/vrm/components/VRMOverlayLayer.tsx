// app/vrm/components/VRMSceneLayer.tsx
'use client'

import styles from './VRMOverlayLayer.module.css'
import DustParticles from './DustParticles'
import MemoryShardCore from './MemoryShardCore'
import ParallaxText from './ParallaxText'
import Caption from './Caption'

export default function VRMOverlayLayer() {
    return (
        <div className={styles.overlayContainer}>
            <div className={styles.aurora} />
            <div className={styles.noise} />
            <div className={styles.grid} />

            <DustParticles />
            <MemoryShardCore />
            <ParallaxText />
            <Caption type="scene" />
        </div>
    )
}


