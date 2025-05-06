// app/translate/features/components/TranslationHistoryList.tsx
'use client'

import { ClipboardCopy, Clock, RefreshCcw, Star, StarOff } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface TranslationHistoryItem {
    id: string
    original: string
    translated: string
    date: string
    targetLang: string
    source: 'ASR' | 'LLM'
    favorite?: boolean
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
    const [items, setItems] = useState(sampleData)
    const [query, setQuery] = useState('')

    const filteredItems = items.filter((item) =>
        item.original.toLowerCase().includes(query.toLowerCase())
    )

    const Badge = ({ children, color }: { children: React.ReactNode, color?: string }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color ?? 'bg-white/20 text-white'}`}>
            {children}
        </span>
    )

    return (
        <div className="mt-10">
            {/* 검색창 */}
            <div className="mb-6">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="원문 텍스트로 검색..."
                className="w-full px-4 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none"
                />
            </div>
        
            {/* 카드 리스트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="p-4 rounded-xl space-y-2 bg-white/10 border border-white/20 backdrop-blur-md shadow-md hover:shadow-lg hover:scale-[1.01] transition-all relative"
                    >
                        {/* 퀵 액션 */}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <button
                                onClick={() =>
                                navigator.clipboard.writeText(item.translated)
                                }
                                className="bg-white/10 hover:bg-white/20 p-1 rounded"
                            >
                            <ClipboardCopy className="w-4 h-4 text-white" />
                            </button>
                            <button
                                onClick={() =>
                                    setItems((prev) =>
                                        prev.map((el) =>
                                        el.id === item.id
                                            ? { ...el, favorite: !el.favorite }
                                            : el
                                        )
                                    )
                                }
                                className="bg-white/10 hover:bg-white/20 p-1 rounded"
                            >
                                {item.favorite ? (
                                    <Star className="w-4 h-4 text-yellow-400" />
                                    ) : (
                                    <StarOff className="w-4 h-4 text-gray-300" />
                                )}
                            </button>
                            <button
                                onClick={() => alert('재번역 기능 연결 예정')}
                                className="bg-white/10 hover:bg-white/20 p-1 rounded"
                            >
                                <RefreshCcw className="w-4 h-4 text-blue-300" />
                            </button>
                        </div>
            
                        {/* 상단 정보 */}
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleString()}
                        </div>
                        <div className="flex items-center text-sm gap-1">
                            <Badge
                                color={
                                item.source === 'ASR'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'bg-pink-500/10 text-pink-400'
                                }
                            >
                            {item.source}
                            </Badge>
                            <span className="text-gray-500">| {item.targetLang.toUpperCase()}</span>
                        </div>
            
                        {/* 내용 */}
                        <div className="text-[14px] font-omyu_pretty text-black mb-1">
                            <span className="font-medium text-gray-400">📝 원문:</span>{' '}
                            {item.original}
                        </div>
                        <div className="text-[13px] text-white font-semibold mb-3">
                            <span className="text-gray-600">🔁 번역:</span> {item.translated}
                        </div>
            
                        {/* 하단 통계 */}
                        <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                            <span>총 번역 수: 15</span>
                            <span>LLM 의역 비율: 60%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
