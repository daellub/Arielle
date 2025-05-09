// app/translate/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Languages } from 'lucide-react'

import Sidebar from '@/app/components/ui/Sidebar'
import TranslatePanel from '@/app/translate/features/components/TranslatePanel'
import TranslationHistoryList, { TranslationHistoryItem } from '../translate/features/components/TranslateHistoryList'
import TranslationAnalyticsPanel from '../translate/features/components/TranslateAnalyticsPanel'

export default function TranslatePage() {
    const [items, setItems] = useState<TranslationHistoryItem[]>([])

    const [asrInput, setAsrInput] = useState('')
    const prevAsrRef = useRef('')

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

    const totalCount = items.length
    const llmCount = items.filter(item => item.source === 'LLM').length
    const asrCount = items.filter(item => item.source === 'ASR').length
    const llmRatio = totalCount > 0 ? Math.round((llmCount / totalCount) * 100) : 0
    const favoriteCount = items.filter(item => item.favorite).length

    return (
        <div className="flex bg-white h-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className='flex-1 flex flex-col gap-6 overflow-y-auto px-20 pt-3 pb-20'>
                    {/* 타이틀 */}
                    <div className="flex items-center gap-4">
                        <Languages className="w-7 h-7 text-blue-400" />
                        <h1 className="text-2xl font-bold text-black">Translate</h1>
                    </div>

                    <div className="flex gap-6 w-full items-start">
                        {/* 번역 패널 */}
                        <div className="flex-[3] max-w-[800px]">
                            <TranslatePanel
                                asrResult={asrInput}
                                onTranslate={(item) => setItems(prev => [item, ...prev])} 
                                items={items}
                            />
                        </div>

                        {/* 통계 패널 */}
                        <div className="flex-[1] grid grid-cols-2 gap-4 min-w-[240px]">
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