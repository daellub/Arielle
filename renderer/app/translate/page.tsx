// app/translate/page.tsx
'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'
import Sidebar from '@/app/components/ui/Sidebar'
import TranslatePanel from '@/app/translate/features/components/TranslatePanel'
import TranslationHistoryList, { TranslationHistoryItem } from './features/components/TranslateHistoryList'
import TranslationAnalyticsPanel from './features/components/TranslateAnalyticsPanel'

const initialItems: TranslationHistoryItem[] = [ {
        id: '1',
        original: '안녕하세요. 반갑습니다.',
        translated: 'Hello. Nice to meet you.',
        date: '2025-05-06T21:00:00Z',
        targetLang: 'en',
        source: 'ASR',
    },
    {
        id: '2',
        original: '오늘 날씨 어때요?',
        translated: 'How is the weather today?',
        date: '2025-05-06T20:30:00Z',
        targetLang: 'en',
        source: 'LLM',
    }, ]

export default function TranslatePage() {
    const [items, setItems] = useState<TranslationHistoryItem[]>(initialItems)

    const totalCount = items.length
    const llmCount = items.filter(item => item.source === 'LLM').length
    const asrCount = items.filter(item => item.source === 'ASR').length
    const llmRatio = totalCount > 0 ? Math.round((llmCount / totalCount) * 100) : 0

    return (
        <div className="flex bg-white h-full overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto px-20 pt-8 pb-20">
                    {/* 상단 타이틀 */}
                    <div className="flex items-center gap-4">
                        <Languages className="w-7 h-7 text-blue-400" />
                        <h1 className="text-2xl font-bold text-black">Translate</h1>
                    </div>

                    <TranslatePanel />
                    
                    <TranslationHistoryList items={items} setItems={setItems} />

                    <TranslationAnalyticsPanel total={totalCount} llmRatio={llmRatio} asrCount={asrCount} />
                </div>
            </div>
        </div>
    )
}