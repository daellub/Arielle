// app/pages/TranslatePage.tsx
'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const api = axios.create({ baseURL: BASE_URL, timeout: 8000 })

export default function TranslatePage() {
    const [items, setItems] = useState<TranslationHistoryItem[]>([])
    const [asrInput, setAsrInput] = useState('')
    const prevAsrRef = useRef('')
    const [sparkles, setSparkles] = useState<Sparkle[]>([])

    const [reducedMotion, setReducedMotion] = useState(false)
    useEffect(() => {
        if (typeof window === 'undefined') return
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const onChange = () => setReducedMotion(mq.matches)
        onChange()
        mq.addEventListener?.('change', onChange)
        return () => mq.removeEventListener?.('change', onChange)
    }, [])

    useEffect(() => {
        const N = 20
        const generated = Array.from({ length: N }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${3 + Math.random() * 2}s`,
        }))
        setSparkles(generated)
    }, [])

    const visibleRef = useRef(true)
    useEffect(() => {
        const onVis = () => (visibleRef.current = !document.hidden)
        document.addEventListener('visibilitychange', onVis)
        return () => document.removeEventListener('visibilitychange', onVis)
    }, [])

    useEffect(() => {
        let timer: number | null = null
        let cancelled = false

        async function poll() {
            if (cancelled) return
            if (!visibleRef.current) {
                timer = window.setTimeout(poll, 1200)
                return
            }
            try {
                const { data } = await api.get('/api/asr/latest')
                const text: string | undefined = data?.text
                if (text && text !== prevAsrRef.current) {
                    prevAsrRef.current = text
                    setAsrInput(text)
                }
            } catch (err) {
                console.error('[ASR fetch 실패]', err)
            } finally {
                timer = window.setTimeout(poll, 2000)
            }
        }

        poll()
        return () => {
            cancelled = true
            if (timer) clearTimeout(timer)
        }
    }, [])

    const { totalCount, llmRatio, asrCount, favoriteCount } = useMemo(() => {
        const total = items.length
        const llm = items.filter(i => i.source === 'LLM').length
        const asr = items.filter(i => i.source === 'ASR').length
        const fav = items.filter(i => i.favorite).length
        const ratio = total > 0 ? Math.round((llm / total) * 100) : 0
        return { totalCount: total, llmRatio: ratio, asrCount: asr, favoriteCount: fav }
    }, [items])

    const handleAddItem = useCallback((item: TranslationHistoryItem) => {
        setItems(prev => [item, ...prev])
    }, [])

    return (
        <div className={`${styles.container} w-full h-full flex flex-col overflow-hidden`}>
            {!reducedMotion && sparkles.map((s, i) => (
                <div
                    key={i}
                    className={styles.sparkle}
                    style={{ top: s.top, left: s.left, animationDelay: s.delay, animationDuration: s.duration }}
                    aria-hidden
                />
            ))}

            <div className="flex-1 overflow-hidden relative z-10 p-6">
                <div className="flex-1 flex flex-col gap-6 px-6 md:px-12 lg:px-20 pt-3 pb-20 min-w-0">
                    <div className="flex items-center gap-3">
                        <Languages className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-black">Translate</h1>
                    </div>

                    <div className="flex gap-6 w-full items-start">
                        <div className="flex-[3] max-w-[800px] min-w-0">
                            <TranslatePanel
                                asrResult={asrInput}
                                onTranslate={handleAddItem}
                                items={items}
                            />
                        </div>

                        <div className="flex-[1] min-w-[240px]">
                            <TranslationAnalyticsPanel
                                total={totalCount}
                                llmRatio={llmRatio}
                                asrCount={asrCount}
                                favoriteCount={favoriteCount}
                                llmFeatureEnabled={false}
                            />
                        </div>
                    </div>

                    <TranslationHistoryList items={items} setItems={setItems} />
                </div>
            </div>
        </div>
    )
}