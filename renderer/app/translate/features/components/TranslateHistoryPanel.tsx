// app/translate/features/components/TranslationHistoryList.tsx
'use client'

import { ClipboardCopy, Clock } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface TranslationHistoryItem {
    id: string
    original: string
    translated: string
    date: string
    targetLang: string
    source: 'ASR' | 'LLM'
}

const sampleData: TranslationHistoryItem[] = [
    {
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
    },
]

export default function TranslationHistoryList() {
    const [items] = useState(sampleData)

    const Badge = ({ children, color }: { children: React.ReactNode, color?: string }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color ?? 'bg-white/20 text-white'}`}>
            {children}
        </span>
    )

    return (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="p-4 rounded-xl space-y-2 bg-white/10 border border-white/20 backdrop-blur-md shadow-md hover:shadow-lg transition-all"
                >
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(item.date).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm gap-1">
                        <Badge
                            color={item.source === 'ASR' 
                                ? 'bg-blue-500/10 text-blue-400' 
                                : 'bg-pink-500/10 text-pink-400'}
                            >
                            {item.source}
                        </Badge>
                        <span className="text-gray-500">| {item.targetLang.toUpperCase()}</span>
                    </div>

                    <div className="text-[14px] font-omyu_pretty text-black mb-1">
                        <span className="font-medium text-gray-400">📝 원문:</span> {item.original}
                    </div>
                    <div className="text-[13px] text-white font-semibold mb-3">
                        <span className="text-gray-600">🔁 번역:</span> {item.translated}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => navigator.clipboard.writeText(item.translated)}
                            className="text-xs text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md flex items-center gap-1"
                        >
                        <ClipboardCopy className="w-4 h-4" /> 복사
                        </button>
                    </div>
                    <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                        <span>총 번역 수: 15</span>
                        <span>LLM 의역 비율: 60%</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
