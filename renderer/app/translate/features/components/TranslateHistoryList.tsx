// app/translate/features/components/TranslationHistoryList.tsx
'use client'

import { ClipboardCopy, Clock, RefreshCcw, Star, StarOff, Download } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import clsx from 'clsx'
import CompareModal from '@/app/components/ui/CompareModal'
import { useNotificationStore } from '@/app/store/useNotificationStore'

const LANG_LABEL: Record<string, string> = {
    en: '🇺🇸 English',
    ja: '🇯🇵 日本語',
    zh: '🇨🇳 中文',
}

export interface TranslationHistoryItem {
    id: string
    original: string
    translated: string
    date: string
    targetLang: string
    source: 'ASR' | 'LLM' | 'Direct'
    favorite?: boolean
    retranslated?: boolean
}

interface TranslationHistoryListProps {
    items: TranslationHistoryItem[]
    setItems: React.Dispatch<React.SetStateAction<TranslationHistoryItem[]>>
}

function highlight(text: string, query: string) {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.split(regex).map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
    )
}

export default function TranslationHistoryList({ items, setItems }: TranslationHistoryListProps) {
    const [query, setQuery] = useState('')
    const [showFavorites, setShowFavorites] = useState(false)
    const [selected, setSelected] = useState<TranslationHistoryItem | null>(null)
    const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'asr' | 'llm'>('latest')
    const notify = useNotificationStore((s) => s.show)

    const handleReTranslate = async (item: TranslationHistoryItem) => {
        try {
            const res = await axios.post('http://localhost:8000/api/translate', {
                text: item.original,
                from_lang: 'ko',
                to: item.targetLang,
            })

            const result = res.data.translated
            notify('재번역이 완료되었습니다.', 'success')

            const newItem: TranslationHistoryItem = {
                ...item,
                id: Date.now().toString(),
                translated: result,
                date: new Date().toISOString(),
                retranslated: true,
                favorite: false,
            }

            setItems(prev =>
                prev.map(el =>
                    el.id === item.id ? newItem : el
                )
            )

            await axios.post('http://localhost:8000/translate/save_translation', {
                id: newItem.id,
                original: newItem.original,
                translated: newItem.translated,
                targetLang: newItem.targetLang,
                source: newItem.source,
            })
        } catch (err) {
            console.error('[재번역 실패]', err)
            notify('재번역에 실패했습니다.', 'error')
        }
    }

    const handleFavoriteToggle = async (item: TranslationHistoryItem) => {
        const newFavorite = !item.favorite

        setItems((prev) =>
            prev.map((el) =>
                el.id === item.id ? { ...el, favorite: newFavorite } : el
            )
        )

        try {
            await axios.patch('http://localhost:8000/translate/favorite', {
                id: item.id,
                favorite: newFavorite,
            })
        } catch (err) {
            console.error('[즐겨찾기 업데이트 실패]', err)
            notify('즐겨찾기 상태 저장에 실패했습니다.', 'error')
        }
    }

    const filteredItems = items.filter(
        (item) =>
            (!showFavorites || item.favorite) &&
            (item.original.includes(query) || item.translated.includes(query))
    )

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (sortBy === 'latest') return new Date(b.date).getTime() - new Date(a.date).getTime()
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
        if (sortBy === 'asr') return a.source === 'ASR' ? -1 : 1
        if (sortBy === 'llm') return a.source === 'LLM' ? -1 : 1
        return 0
    })

    const Badge = ({ children, color }: { children: React.ReactNode, color?: string }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color ?? 'bg-white/20 text-white'}`}>
            {children}
        </span>
    )

    return (
        <div className="">
            {/* 검색창 */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="원문 텍스트로 검색..."
                    className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/10 border border-blue-300 text-black placeholder-gray-400 focus:outline-none z-10"
                />

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFavorites(false)}
                        className={clsx(
                            'px-4 py-1 text-sm rounded-md border transition-all',
                            !showFavorites
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white/10 text-gray-300 border-white/20'
                        )}
                    >
                        전체 보기
                    </button>
                    <button
                        onClick={() => setShowFavorites(true)}
                        className={clsx(
                            'px-4 py-1 text-sm rounded-md border transition-all',
                            showFavorites
                            ? 'bg-yellow-400 text-white border-yellow-400'
                            : 'bg-white/10 text-gray-300 border-white/20'
                        )}
                    >
                        즐겨찾기만
                    </button>
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-gray-500 font-medium">정렬</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-1 text-sm bg-white/10 text-black border border-white/20 rounded-md focus:outline-none"
                        >
                            <option value="latest">최신순</option>
                            <option value="oldest">오래된순</option>
                            <option value="asr">ASR 먼저</option>
                            <option value="llm">LLM 먼저</option>
                        </select>
                    </div>
                </div>
            </div>

    
            {/* 카드 리스트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="p-4 rounded-xl space-y-2 bg-white/10 z-10 border border-white/20 backdrop-blur-md shadow-md hover:shadow-lg hover:-translate-y-1 transition-all relative"
                    >
                        {/* 퀵 액션 */}
                        <div className="absolute top-2 right-2 flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(item.translated)
                                    notify('번역 결과를 복사했습니다.', 'info')
                                }}
                                className="bg-white/10 hover:bg-white/20 p-1 rounded"
                            >
                                <ClipboardCopy className="w-4 h-4 text-black" />
                            </button>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation()
                                    handleFavoriteToggle(item)
                                }}
                                className="bg-white/10 hover:bg-white/20 p-1 rounded"
                            >
                                {item.favorite ? (
                                    <Star className="w-4 h-4 text-yellow-400" />
                                ) : (
                                    <StarOff className="w-4 h-4 text-gray-300" />
                                )}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleReTranslate(item)
                                }}
                                className="bg-white/10 hover:bg-white/20 p-1 rounded"
                                title="재번역"
                            >
                                <RefreshCcw className="w-4 h-4 text-blue-300" />
                            </button>
                        </div>
                
                        {/* 상단 정보 */}
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleString()}
                            {item.retranslated && (
                                <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium text-[10px]">
                                재번역됨
                                </span>
                            )}
                        </div>
                        <div className="flex items-center text-sm gap-1">
                            <Badge
                                color={
                                    item.source === 'ASR'
                                    ? 'bg-blue-100 text-blue-600'
                                    : item.source === 'Direct'
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'bg-purple-100 text-purple-600'
                                }
                            >
                                {item.source}
                            </Badge>
                            <span className="text-gray-500">
                                | {LANG_LABEL[item.targetLang] ?? item.targetLang.toUpperCase()}
                            </span>
                        </div>
                
                        {/* 내용 */}
                        <div className="text-[14px] font-omyu_pretty text-black mb-1">
                            <span className="font-medium text-gray-400">📝 원문:</span> {highlight(item.original, query)}
                        </div>
                        <div className="text-[13px] text-black font-semibold mb-3">
                            <span className="text-gray-600">🔁 번역:</span> {highlight(item.translated, query)}
                        </div>
                
                        {/* 하단 통계 */}
                        <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                            <span>
                                {item.source === 'ASR'
                                    ? 'ASR 인식 기반 번역'
                                    : item.source === 'LLM'
                                    ? 'LLM 결과 기반 번역'
                                    : '사용자 입력 기반 번역'}
                            </span>
                            <span className="text-gray-300">ID: {item.id.slice(-4)}</span>
                        </div>
                    </div>
                ))}
                {selected && (
                    <CompareModal
                        open={!!selected}
                        onOpenChange={() => setSelected(null)}
                        original={selected.original}
                        asr={selected.translated}
                        llm={selected.source === 'LLM' ? selected.translated : ''}
                        source={selected.source}
                        retranslated={selected.retranslated}
                    />
                )}
            </div>
        </div>
    )
}
