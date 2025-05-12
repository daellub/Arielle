// app/translate/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Languages } from 'lucide-react'

import TranslatePanel from '@/app/translate/features/components/TranslatePanel'
import TranslationHistoryList, { TranslationHistoryItem } from '../translate/features/components/TranslateHistoryList'
import TranslationAnalyticsPanel from '../translate/features/components/TranslateAnalyticsPanel'

import styles from './TranslatePage.module.css'

interface Sparkle {
    top: string
    left: string
    delay: string
    duration: string
}

export default function TranslatePage() {
    const [items, setItems] = useState<TranslationHistoryItem[]>([])

    const [asrInput, setAsrInput] = useState('')
    const prevAsrRef = useRef('')

    const [sparkles, setSparkles] = useState<Sparkle[]>([])

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/asr/latest')
                const text = res.data.text
                if (text && text !== prevAsrRef.current) {
                    prevAsrRef.current = text
                    setAsrInput(text)
                }
            } catch (err) {
                console.error('[ASR fetch 실패]', err)
            }
        }, 2000)
        
        return () => clearInterval(interval)
    })

    useEffect(() => {
        const generated = Array.from({ length: 20 }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${3 + Math.random() * 2}s`,
        }))
        setSparkles(generated)
    }, [])

    const totalCount = items.length
    const llmCount = items.filter(item => item.source === 'LLM').length
    const asrCount = items.filter(item => item.source === 'ASR').length
    const llmRatio = totalCount > 0 ? Math.round((llmCount / totalCount) * 100) : 0
    const favoriteCount = items.filter(item => item.favorite).length

    return (
        <div className={`${styles.container} w-full h-full flex flex-col overflow-hidden`}>
            {sparkles.map((s, i) => (
                <div
                    key={i}
                    className={styles.sparkle}
                    style={{
                        top: s.top,
                        left: s.left,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                    }}
                />
            ))}
            <div className="flex-1 overflow-y-auto relative z-10 p-6">
                <div className="flex-1 flex flex-col gap-6 px-20 pt-3 pb-20">
                    {/* 타이틀 */}
                    <div className="flex items-center gap-4">
                        <Languages className="w-7 h-7 text-blue-400" />
                        <h1 className="text-2xl font-bold text-black">Translate</h1>
                    </div>

                    {/* 번역 입력 & 통계 */}
                    <div className="flex gap-6 w-full items-start z-10">
                        <div className="flex-[3] max-w-[800px]">
                            <TranslatePanel
                                asrResult={asrInput}
                                onTranslate={(item) => setItems(prev => [item, ...prev])}
                                items={items}
                            />
                        </div>
                        <div className="flex-[1] grid grid-cols-2 gap-4 min-w-[240px] z-10">
                            <TranslationAnalyticsPanel
                                total={totalCount}
                                llmRatio={llmRatio}
                                asrCount={asrCount}
                                favoriteCount={favoriteCount}
                                llmFeatureEnabled={false}
                            />
                        </div>
                    </div>

                    {/* 번역 기록 */}
                    <TranslationHistoryList items={items} setItems={setItems} />
                </div>
            </div>
        </div>
    )
}