// app/tts/components/TTSCharacterCard.tsx
'use client'

import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import styles from './TTSCharacterCard.module.css'

export default function TTSCharacterCard() {
    return (
        <div className={styles.card}>
            <div className={styles.avatarWrap}>
                <Image
                    src="/assets/arielle.png"
                    alt="Arielle"
                    width={48}
                    height={48}
                    className={styles.avatar}
                />
                <div className={styles.statusDot} />
            </div>
            <div className={styles.text}>
                <div className={styles.name}>Arielle</div>
                <div className={styles.sub}>
                    <Sparkles className="w-4 h-4 inline-block mr-1 text-[#c299ff]" />
                </div>
            </div>
        </div>
    )
}
