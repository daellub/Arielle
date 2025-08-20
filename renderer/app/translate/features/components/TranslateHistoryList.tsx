// app/translate/features/components/TranslationHistoryList.tsx
'use client'

import React, { useCallback, useDeferredValue, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import clsx from 'clsx'
import {
    ClipboardCopy,
    Clipboard,
    Clock,
    RefreshCcw,
    Star,
    StarOff,
    Download,
    Search,
    Filter
} from 'lucide-react'
import { useNotificationStore } from '@/app/store/useNotificationStore'

const CompareModal = dynamic(() => import('@/app/components/ui/CompareModal'), {
    ssr: false
})

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const api = axios.create({ baseURL: BASE_URL, timeout: 8000 })

const LANG_LABEL: Record<string, string> = {
    en: '🇺🇸 English',
    ja: '🇯🇵 日本語',
    zh: '🇨🇳 中文'
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

function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlight(text: string, query: string) {
    if (!query) return text
    const safe = escapeRegExp(query)
    const re = new RegExp(`(${safe})`, 'gi')
    const parts = text.split(re)
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <mark key={i} className="bg-yellow-200/90 text-black px-0.5 rounded">
                {part}
            </mark>
        ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
        )
    )
}

const Badge = React.memo(function Badge({
    children,
    color
}: {
    children: React.ReactNode
    color?: string
}) {
    return (
        <span
            className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-semibold border',
                color ?? 'bg-white/20 text-white border-white/25'
            )}
        >
            {children}
        </span>
    )
})

export default function TranslationHistoryList({ items, setItems }: TranslationHistoryListProps) {
    const [query, setQuery] = useState('')
    const [showFavorites, setShowFavorites] = useState(false)
    const [selected, setSelected] = useState<TranslationHistoryItem | null>(null)
    const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'asr' | 'llm'>('latest')
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const notify = useNotificationStore((s) => s.show)

    const deferredQuery = useDeferredValue(query)

    const dtf = useMemo(
        () =>
            typeof window !== 'undefined'
                ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium' })
                : null,
        []
    )

    const handleReTranslate = useCallback(
        async (item: TranslationHistoryItem) => {
            try {
                setLoadingId(item.id)
                const res = await api.post('/api/translate', {
                    text: item.original,
                    from_lang: 'ko',
                    to: item.targetLang
                })

                const result = res.data?.translated ?? ''
                const newItem: TranslationHistoryItem = {
                    ...item,
                    id: Date.now().toString(),
                    translated: result,
                    date: new Date().toISOString(),
                    retranslated: true,
                    favorite: false
                }

                setItems((prev) => prev.map((el) => (el.id === item.id ? newItem : el)))

                await api.post('/translate/save_translation', {
                    id: newItem.id,
                    original: newItem.original,
                    translated: newItem.translated,
                    targetLang: newItem.targetLang,
                    source: newItem.source
                })

                notify('재번역이 완료되었습니다.', 'success')
            } catch (err) {
                console.error('[재번역 실패]', err)
                notify('재번역에 실패했습니다.', 'error')
            } finally {
                setLoadingId(null)
            }
        },
        [notify, setItems]
    )

    const handleFavoriteToggle = useCallback(
        async (item: TranslationHistoryItem) => {
            const nextFav = !item.favorite
            const prev = items

            setItems((prevItems) =>
                prevItems.map((el) => (el.id === item.id ? { ...el, favorite: nextFav } : el))
            )

            try {
                await api.patch('/translate/favorite', {
                    id: item.id,
                    favorite: nextFav
                })
            } catch (err) {
                console.error('[즐겨찾기 업데이트 실패]', err)
                notify('즐겨찾기 상태 저장에 실패했습니다.', 'error')
                setItems(prev)
            }
        },
        [items, notify, setItems]
    )

    const copyText = useCallback(
        async (text: string, msg = '복사했습니다.') => {
            try {
                await navigator.clipboard.writeText(text)
                notify(msg, 'info')
            } catch {
                notify('클립보드 권한을 확인해주세요.', 'error')
            }
        },
        [notify]
    )

    const exportCSV = useCallback((rows: TranslationHistoryItem[]) => {
        const header = ['id', 'date', 'source', 'targetLang', 'original', 'translated']
        const esc = (s: string) =>
            `"${(s ?? '').replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`
        const csv =
            [header.join(',')]
                .concat(
                    rows.map((r) =>
                        [
                            r.id,
                            r.date,
                            r.source,
                            r.targetLang,
                            esc(r.original),
                            esc(r.translated)
                        ].join(',')
                    )
                )
                .join('\n')

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `translations_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }, [])

    const viewItems = useMemo(() => {
        const q = deferredQuery.trim().toLowerCase()
        let arr = items

        if (showFavorites) {
            arr = arr.filter((i) => i.favorite)
        }
        if (q) {
            arr = arr.filter(
                (i) =>
                    i.original.toLowerCase().includes(q) ||
                    i.translated.toLowerCase().includes(q)
            )
        }

        const byTimeDesc = (a: TranslationHistoryItem, b: TranslationHistoryItem) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        const byTimeAsc = (a: TranslationHistoryItem, b: TranslationHistoryItem) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()

        if (sortBy === 'latest') return [...arr].sort(byTimeDesc)
        if (sortBy === 'oldest') return [...arr].sort(byTimeAsc)
        if (sortBy === 'asr') {
            const asr = arr.filter((x) => x.source === 'ASR').sort(byTimeDesc)
            const other = arr.filter((x) => x.source !== 'ASR').sort(byTimeDesc)
            return [...asr, ...other]
        }
        if (sortBy === 'llm') {
            const llm = arr.filter((x) => x.source === 'LLM').sort(byTimeDesc)
            const other = arr.filter((x) => x.source !== 'LLM').sort(byTimeDesc)
            return [...llm, ...other]
        }
        return arr
    }, [items, deferredQuery, showFavorites, sortBy])

    return (
        <div className="relative">
            <div className="sticky top-0 z-10 -mt-2 mb-5 bg-gradient-to-b from-white/80 to-white/20 backdrop-blur-sm rounded-xl border border-white/30 p-3">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                    <div className="flex-1">
                        <label className="sr-only" htmlFor="history-search">원문/번역 검색</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                id="history-search"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="원문 또는 번역으로 검색…"
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/70 border border-blue-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFavorites((v) => !v)}
                            className={clsx(
                                'inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border transition-all',
                                showFavorites
                                    ? 'bg-yellow-400 text-white border-yellow-400 shadow'
                                    : 'bg-white/60 text-gray-700 border-white/40 hover:bg-white/80'
                            )}
                            aria-pressed={showFavorites}
                        >
                            <Filter className="w-4 h-4" />
                            {showFavorites ? '즐겨찾기만' : '전체 보기'}
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-1.5 text-sm bg-white/60 text-gray-800 border border-white/40 rounded-md focus:outline-none hover:bg-white/80"
                            aria-label="정렬"
                        >
                            <option value="latest">최신순</option>
                            <option value="oldest">오래된순</option>
                            <option value="asr">ASR 먼저</option>
                            <option value="llm">LLM 먼저</option>
                        </select>

                        <button
                            onClick={() => exportCSV(viewItems)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border bg-white/60 text-gray-800 border-white/40 hover:bg-white/80"
                            title="CSV로 내보내기"
                        >
                            <Download className="w-4 h-4" />
                            내보내기
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-1">
                {viewItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-white/40 border border-white/40 rounded-xl">
                        번역 기록이 없습니다. 검색어/필터를 확인해 주세요.
                    </div>
                ) : (
                    <div className="grid auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {viewItems.map((item) => {
                            const isLoading = loadingId === item.id
                            return (
                                <div
                                    key={item.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`번역 카드 ${item.id}`}
                                    onClick={() => setSelected(item)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            setSelected(item)
                                        }
                                    }}
                                    className={clsx(
                                        'group relative text-left cursor-pointer p-4 rounded-xl border backdrop-blur-md transition-all',
                                        'bg-white/55 border-white/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5',
                                        'focus:outline-none focus:ring-2 focus:ring-blue-300'
                                    )}
                                >
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                copyText(item.translated, '번역 결과를 복사했습니다.')
                                            }}
                                            className="bg-white/70 hover:bg-white p-1 rounded border border-white/60"
                                            title="번역 복사"
                                            aria-label="번역 복사"
                                        >
                                            <ClipboardCopy className="w-4 h-4 text-gray-800" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                copyText(`${item.original}\n---\n${item.translated}`, '원문+번역을 복사했습니다.')
                                            }}
                                            className="bg-white/70 hover:bg-white p-1 rounded border border-white/60"
                                            title="원문+번역 복사"
                                            aria-label="원문+번역 복사"
                                        >
                                            <Clipboard className="w-4 h-4 text-gray-800" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleFavoriteToggle(item)
                                            }}
                                            className="bg-white/70 hover:bg-white p-1 rounded border border-white/60"
                                            title="즐겨찾기"
                                            aria-label="즐겨찾기"
                                        >
                                            {item.favorite ? (
                                                <Star className="w-4 h-4 text-yellow-500" />
                                            ) : (
                                                <StarOff className="w-4 h-4 text-gray-500" />
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (!isLoading) handleReTranslate(item)
                                            }}
                                            disabled={isLoading}
                                            className={clsx(
                                                'p-1 rounded border bg-white/70 hover:bg-white',
                                                'border-white/60',
                                                isLoading && 'opacity-60 cursor-not-allowed'
                                            )}
                                            title="재번역"
                                            aria-label="재번역"
                                        >
                                            <RefreshCcw
                                                className={clsx(
                                                    'w-4 h-4 text-blue-600',
                                                    isLoading && 'animate-spin'
                                                )}
                                            />
                                        </button>
                                    </div>

                                    <div className="text-xs text-gray-600 flex items-center gap-2 mb-1.5">
                                        <Clock className="w-3 h-3" />
                                        {dtf ? dtf.format(new Date(item.date)) : item.date}
                                        {item.retranslated && (
                                            <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium text-[10px]">
                                                재번역됨
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center text-sm gap-1 mb-2">
                                        <Badge
                                            color={
                                                item.source === 'ASR'
                                                    ? 'bg-blue-100 text-blue-600 border-blue-200'
                                                    : item.source === 'Direct'
                                                    ? 'bg-rose-100 text-rose-600 border-rose-200'
                                                    : 'bg-purple-100 text-purple-600 border-purple-200'
                                            }
                                        >
                                            {item.source}
                                        </Badge>
                                        <span className="text-gray-600">
                                            | {LANG_LABEL[item.targetLang] ?? item.targetLang.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="text-[14px] text-gray-800 mb-2">
                                        <span className="font-medium text-gray-500">📝 원문:</span>{' '}
                                        {renderHighlight(item.original, deferredQuery)}
                                    </div>
                                    <div className="text-[13px] text-gray-900 font-semibold">
                                        <span className="text-gray-600">🔁 번역:</span>{' '}
                                        {renderHighlight(item.translated, deferredQuery)}
                                    </div>

                                    <div className="mt-3 pt-2 flex justify-between items-center text-[11px] text-gray-500 border-t border-white/60">
                                        <span>
                                            {item.source === 'ASR'
                                                ? 'ASR 인식 기반 번역'
                                                : item.source === 'LLM'
                                                ? 'LLM 결과 기반 번역'
                                                : '사용자 입력 기반 번역'}
                                        </span>
                                        <span className="text-gray-500">ID: {item.id.slice(-4)}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

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
    )
}
