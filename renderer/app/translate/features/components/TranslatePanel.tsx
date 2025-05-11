// app/translate/features/components/TranslatePanel.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { MessageSquareText, Languages, Sparkles } from 'lucide-react'
import TranslateCard from './TranslateCard'
import { TranslationHistoryItem } from './TranslateHistoryList'
import axios from 'axios'

import { useNotificationStore } from '@/app/store/useNotificationStore'
import ExportDropdown from '../utils/ExportDropdown'

interface Props {
    asrResult?: string
    onTranslate: (item: TranslationHistoryItem) => void
    items: TranslationHistoryItem[]
}

export default function TranslatePanel({ asrResult, onTranslate, items }: Props) {
    const [input, setInput] = useState('')
    const [asrInput, setAsrInput] = useState('')
    const prevAsrRef = useRef<string|undefined>(undefined)
    const [translated, setTranslated] = useState('')
    const [llmResult, setLLMResult] = useState('')
    const [targetLang, setTargetLang] = useState('en')
    const [lastTranslatedTime, setLastTranslatedTime] = useState<string>('')
    const [lastSourceType, setLastSourceType] = useState<'ASR' | 'Direct' | 'None'>('None')
    const [activeTab, setActiveTab] = useState<'ASR' | 'LLM'>('ASR')
    const notify = useNotificationStore((s) => s.show)

    useEffect(() => {
        if (!asrResult?.trim()) return

        if (prevAsrRef.current === undefined) {
            prevAsrRef.current = asrResult
            return
        }

        if (prevAsrRef.current === asrResult) return
        prevAsrRef.current = asrResult

        setLastTranslatedTime(
            typeof window !== 'undefined'
                ? new Date().toLocaleString()
                : 'Loading...'
        )
        setAsrInput(asrResult)
        handleTranslate(asrResult, 'ASR')
    }, [asrResult])

    const handleTranslate = async (
        text: string = input,
        forcedSourceType: 'ASR' | 'Direct' = 'Direct'
    ) => {
        if (!text.trim()) return

        const sourceType = forcedSourceType
        setLastSourceType(sourceType)

        if (sourceType === 'Direct') setAsrInput('')

        try {
            console.log('[번역 요청 시작]', text)
            const res = await axios.post('http://localhost:8000/api/translate', {
                text,
                from_lang: 'ko',
                to: targetLang,
            })

            const result = res.data.translated
            setTranslated(result)

            const item: TranslationHistoryItem = {
                id: Date.now().toString(),
                original: text,
                translated: result,
                date: new Date().toISOString(),
                targetLang,
                source: sourceType,
            }

            await axios.post('http://localhost:8000/translate/save_translation', {
                id: item.id,
                original: item.original,
                translated: item.translated,
                targetLang: item.targetLang,
                source: item.source,
            })

            onTranslate(item)
            setLastTranslatedTime(new Date().toLocaleString())
            notify('번역이 완료되었습니다.', 'success')
        } catch (err) {
            console.error('번역 실패:', err)
            notify('번역 중 오류가 발생했습니다.', 'error')
        }
    }

    return (
        <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-[inset_0_4px_20px_rgba(0,0,0,0.1)] border border-white/10 flex flex-col gap-6 z-10">
            <div className="flex w-full items-center gap-3">
                <textarea
                    className="flex-1 rounded-md border border-gray-300 p-3 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none shadow-sm"
                    rows={1}
                    placeholder="번역할 문장을 입력하세요..."
                    spellCheck={false}
                />

                <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-5 h-5 border border-gray-400 rounded-sm peer-checked:bg-indigo-500 flex items-center justify-center transition">
                        <svg
                            className="w-3 h-3 text-white hidden peer-checked:block"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                        >
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                        LLM 전송 여부
                </label>
            </div>
            
            {/* 상단 번역 카드들 */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch z-10">
                <div className='w-full md:w-[250px] lg:w-[270px] h-full z-10'>
                    <TranslateCard
                        icon={
                            <div className="flex items-center gap-2 h-full">
                                <MessageSquareText className="w-4 h-4" />
                                <span className={clsx(
                                    'text-xs font-medium rounded px-1 py-0.5 border',
                                    lastSourceType === 'ASR'
                                        ? 'text-blue-600 bg-blue-100 border-blue-200'
                                        : lastSourceType === 'Direct'
                                        ? 'text-rose-600 bg-rose-100 border-rose-200'
                                        : 'text-gray-500 bg-gray-100 border-gray-200'
                                )}>
                                    {lastSourceType}
                                </span>
                            </div>
                        }
                        title="입력 텍스트"
                        content={
                            lastSourceType === 'ASR' && asrInput
                            ? asrInput
                            : input || '받은 텍스트가 없습니다.'
                        }
                        className='h-full'
                    />
                </div>

                {/* 탭 + 카드 */}
                <div
                    className={clsx(
                        'relative w-full md:w-[250px] lg:w-[270px] h-full',
                        'rounded-t-[32px] rounded-b-2xl bg-white/20 backdrop-blur-md border border-white/30',
                        'overflow-visible',
                        'shadow-md',
                        activeTab === 'ASR' ? 'shadow-blue-200/40' : 'shadow-pink-200/40',
                        'font-MapoPeacefull text-bold'
                    )}
                >
                    {/* 탭 버튼 그룹 */}
                    <div className="absolute -top-4 left-0 flex items-center gap-1 bg-white/30 backdrop-blur-md rounded-full px-1 py-0.5 border border-white/50 shadow-sm z-20">
                        <button
                            onClick={() => setActiveTab('ASR')}
                            className={clsx(
                                'px-4 py-1.5 text-sm font-semibold rounded-full transition',
                                activeTab === 'ASR'
                                    ? 'bg-white text-blue-600 shadow shadow-blue-200'
                                    : 'text-black/80 hover:text-black'
                            )}
                        >
                            ASR
                        </button>
                        <button
                            onClick={() => setActiveTab('LLM')}
                            className={clsx(
                                'px-4 py-1.5 text-sm font-semibold rounded-full transition',
                                activeTab === 'LLM'
                                    ? 'bg-white text-pink-600 shadow shadow-pink-200'
                                    : 'text-black/80 hover:text-black'
                            )}
                        >
                            LLM
                        </button>
                    </div>

                    {/* 카드 콘텐츠 */}
                    <div className="pt-8 px-5 pb-5 bg-white rounded-b-lg">
                        {/* 제목 */}
                        <div className="flex items-center gap-3 mb-4">
                            <Languages
                                className={clsx(
                                'w-5 h-5',
                                activeTab === 'ASR' ? 'text-blue-500' : 'text-pink-500'
                                )}
                            />
                            <h3
                                className={clsx(
                                'text-sm font-bold',
                                activeTab === 'ASR' ? 'text-blue-500' : 'text-pink-500'
                                )}
                            >
                                {activeTab === 'ASR' ? 'ASR 번역 결과' : 'LLM 번역 결과'}
                            </h3>
                        </div>
                        {/* 본문 */}
                        <p className="text-sm leading-relaxed text-gray-800 font-MapoPeacefull">
                            {activeTab === 'ASR'
                                ? translated || '번역 결과 없음'
                                : llmResult || 'LLM 결과 없음'}
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-[230px] lg:w-[250px] h-full">
                    <TranslateCard
                        className="h-full border border-pink-300 shadow-pink-200 shadow-md bg-white"
                        icon={<Sparkles className="w-4 h-4" />}
                        title="LLM 의역 결과"
                        content="준비중인 기능입니다."
                        color="text-pink-500"
                        glow={false}
                    />
                </div>
            </div>

            {/* 하단 액션 영역 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        마지막 번역 시각: {lastTranslatedTime}
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-600">번역 대상 언어</label>
                        <select 
                            className="px-3 py-1.5 rounded-md bg-white/60 text-sm shadow-sm focus:outline-none"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                        >
                            <option value="en">영어</option>
                            <option value="ja">일본어</option>
                            <option value="zh">중국어</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <ExportDropdown items={items} />
                    <button 
                        className="px-4 py-1.5 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white shadow"
                        onClick={() => handleTranslate(input)}
                    >
                        번역
                    </button>
                    <button 
                        className="px-4 py-1.5 text-sm rounded-md bg-white/80 hover:bg-gray:300 text-gray-700 shadow border"
                        onClick={() => {
                            navigator.clipboard.writeText(translated)
                            notify('클립보드에 결과를 복사했습니다.', 'info')
                        }}
                    >
                        복사
                    </button>
                </div>
            </div>
        </div>
    )
}