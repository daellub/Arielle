// app/tts/components/TTSPanelHeader.tsx
'use client'

import TTSCharacterCard from './TTSCharacterCard'
import TTSPresetSelector from './TTSPresetSelector'
import styles from './TTSPanelHeader.module.css'

export default function TTSPanelHeader() {
    return (
        <div className={styles.header}>
            <TTSCharacterCard />
            <TTSPresetSelector />
        </div>
    )
}
