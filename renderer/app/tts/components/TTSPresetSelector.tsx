// app/tts/components/TTSPresetSelector.tsx
'use client'

import { useState } from 'react'
import styles from './TTSPresetSelector.module.css'

const PRESETS = ['Whisper', 'Elven', 'Robotic']

export default function TTSPresetSelector() {
    const [selected, setSelected] = useState('Elven')

    return (
        <div className={styles.group}>
            {PRESETS.map((preset) => (
                <button
                    key={preset}
                    className={`${styles.button} ${selected === preset ? styles.active : ''}`}
                    onClick={() => setSelected(preset)}
                >
                    {preset}
                </button>
            ))}
        </div>
    )
}
