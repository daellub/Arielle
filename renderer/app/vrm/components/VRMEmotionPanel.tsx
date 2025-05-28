// app/vrm/components/VRMEmotionPanel.tsx
'use client'

import AuroraSlider from '@/app/tts/components/aurora/AuroraSlider'
import styles from './VRMEmotionPanel.module.css'
import { useVRMStore } from '@/app/vrm/store/vrmStore'
import { useState } from 'react'

const EMOTIONS = [
    { label: 'Neutral', emoji: '😐', key: 'neutral' },
    { label: 'Happy', emoji: '😊', key: 'happy' },
    { label: 'Sad', emoji: '😢', key: 'sad' },
    { label: 'Angry', emoji: '😠', key: 'angry' },
    { label: 'Shy', emoji: '🥺', key: 'shy' },
]

const POSES = [
    { label: 'Idle', emoji: '🧍', key: 'idle' },
    { label: 'Wave', emoji: '👋', key: 'wave' },
    { label: 'Point', emoji: '👉', key: 'point' },
    { label: 'Listen', emoji: '👂', key: 'listen' },
]

export default function VRMEmotionPanel() {
    const selectedEmotion = useVRMStore((s) => s.selectedEmotion)
    const setEmotion = useVRMStore((s) => s.setEmotion)

    const emotionStrength = useVRMStore((s) => s.emotionStrength)
    const setEmotionStrength = useVRMStore((s) => s.setEmotionStrength)

    const poseBlend = useVRMStore((s) => s.poseBlend)
    const setPoseBlend = useVRMStore((s) => s.setPoseBlend)

    const [expanded, setExpanded] = useState<'emotion' | 'pose' | null>(null)

    return (
        <div className={styles.panel}>
            <div className={styles.section}>
                <div className={styles.headerRow}>
                    <h3 className={styles.sectionTitle}>Emotion Preset</h3>
                    <button className={styles.toggleBtn}
                        onClick={() => setExpanded(expanded === 'emotion' ? null : 'emotion')}>
                        {expanded === 'emotion' ? '−' : '+'}
                    </button>
                </div>
                {expanded === 'emotion' && (
                    <>
                        <div className={styles.emotionList}>
                            {EMOTIONS.map(({ key, emoji }) => (
                                <button
                                    key={key}
                                    onClick={() => setEmotion(key)}
                                    className={`${styles.emotionBtn} ${selectedEmotion === key ? styles.active : ''}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <AuroraSlider
                            label="Strength"
                            value={emotionStrength}
                            onChange={setEmotionStrength}
                        />
                    </>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.headerRow}>
                    <h3 className={styles.sectionTitle}>Pose Mixer</h3>
                    <button className={styles.toggleBtn}
                        onClick={() => setExpanded(expanded === 'pose' ? null : 'pose')}>
                        {expanded === 'pose' ? '−' : '+'}
                    </button>
                </div>
                {expanded === 'pose' && (
                    <div className={styles.poseList}>
                        {POSES.map(({ key, emoji }) => (
                            <AuroraSlider
                                key={key}
                                label={`${emoji} ${key}`}
                                value={poseBlend[key as keyof typeof poseBlend]}
                                onChange={(v) => setPoseBlend(key as keyof typeof poseBlend, v)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}