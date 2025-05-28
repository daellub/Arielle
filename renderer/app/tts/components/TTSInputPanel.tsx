// app/tts/components/TTSInputPanel.tsx
'use client'

import { useState } from 'react'
import AuroraButton from '@/app/tts/components/aurora/AuroraButton'
import AuroraSlider from '@/app/tts/components/aurora/AuroraSlider'
import styles from './TTSInputPanel.module.css'

interface Props {
    onSynthesize: (text: string) => void
    isLoading?: boolean
}

export default function TTSInputPanel({ onSynthesize, isLoading = false }: Props) {
    const [text, setText] = useState('')
    const [speed, setSpeed] = useState(1)
    const [pitch, setPitch] = useState(0)

    const handleClick = () => {
        if (text.trim()) {  
            onSynthesize(text)
        }
    }

    return (
        <div className={styles.panel}>
            <div className={styles.glowLayer} />
            
            <textarea
                className={styles.textarea}
                placeholder="엘프의 음성을 담을 문장을 적어주세요..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

            <div className={styles.sliders}>
                <div className={styles.sliderGroup}>
                    <AuroraSlider
                        label="속도"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={speed}
                        onChange={setSpeed}
                    />
                </div>
                <div className={styles.sliderGroup}>
                    <AuroraSlider
                        label="피치"
                        min={-5}
                        max={5}
                        step={1}
                        value={pitch}
                        onChange={setPitch}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <AuroraButton onClick={handleClick} disabled={isLoading}>
                    {isLoading ? '합성 중...' : '🎤 음성 합성하기'}
                </AuroraButton>
            </div>
        </div>
    )
}
