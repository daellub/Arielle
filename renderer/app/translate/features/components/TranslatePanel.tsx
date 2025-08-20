// app/translate/features/components/TranslatePanel.tsx
'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import clsx from 'clsx'
import { MessageSquareText, Languages, Sparkles, ClipboardCopy, Loader2 } from 'lucide-react'
import TranslateCard from './TranslateCard'
import { TranslationHistoryItem } from './TranslateHistoryList'
import axios from 'axios'

import { useNotificationStore } from '@/app/store/useNotificationStore'
import ExportDropdown from '../utils/ExportDropdown'

import { useLLMStream } from '@/app/llm/hooks/useLLMStream'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'

interface Props {
    asrResult?: string
    onTranslate: (item: TranslationHistoryItem) => void
    items: TranslationHistoryItem[]
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const api = axios.create({ baseURL: BASE_URL, timeout: 12000 })

export default function TranslatePanel({ asrResult, onTranslate, items }: Props) {
    const [input, setInput] = useState('')
    const [asrInput, setAsrInput] = useState('')
    const prevAsrRef = useRef<string|undefined>(undefined)

    const [translated, setTranslated] = useState('')
    const [targetLang, setTargetLang] = useState('en')
    const [lastTranslatedTime, setLastTranslatedTime] = useState<string>('')
    const [lastSourceType, setLastSourceType] = useState<'ASR' | 'Direct' | 'None'>('None')
    const [activeTab, setActiveTab] = useState<'ASR' | 'LLM'>('ASR')
    const [isTranslating, setIsTranslating] = useState(false)
    const [shouldSendLLM, setShouldSendLLM] = useState(true)

    const notify = useNotificationStore((s) => s.show)
    const { send } = useLLMStream()
    const addMessage = useLLMStore((s) => s.addMessage)
    const llmMessages = useLLMStore((s) => s.messages)

    const lastAssistantMsg = useMemo(
        () => [...llmMessages].reverse().find((m) => m.role === 'assistant' && !!m.jaTranslatedMessage),
        [llmMessages]
    )

    const lastSavedIdRef = useRef<string | null>(null)

    const dtf = useMemo(
        () => (typeof window !== 'undefined' ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium' }) : null),
        []
    )

    useEffect(() => {
        const text = asrResult?.trim()
        if (!text) return

        if (prevAsrRef.current === undefined) {
            prevAsrRef.current = text
            return
        }
        if (prevAsrRef.current === text) return
        prevAsrRef.current = text

        setAsrInput(text)
        setLastTranslatedTime(dtf ? dtf.format(new Date()) : new Date().toLocaleString())
        handleTranslate(text, 'ASR')
    }, [asrResult, dtf])


    useEffect(() => {
        if (!lastAssistantMsg?.jaTranslatedMessage || !lastAssistantMsg.message) return

        const content = lastAssistantMsg.message
        const translatedJa = lastAssistantMsg.jaTranslatedMessage
        const uniqueKey = content + translatedJa
        if (lastSavedIdRef.current === uniqueKey) return
        lastSavedIdRef.current = uniqueKey

        const item: TranslationHistoryItem = {
            id: Date.now().toString(),
            original: content,
            translated: translatedJa,
            date: new Date().toISOString(),
            targetLang: 'ja',
            source: 'LLM',
        }

        onTranslate(item)
        api.post('/translate/save_translation', {
            id: item.id,
            original: item.original,
            translated: item.translated,
            targetLang: item.targetLang,
            source: item.source
        }).catch((e) => {
            console.error('[LLM 저장 실패]', e)
        })
    }, [lastAssistantMsg?.jaTranslatedMessage, lastAssistantMsg?.message, onTranslate])

    const copyToClipboard = useCallback(async (text: string, okMsg = '클립보드에 복사했습니다.') => {
        try {
            await navigator.clipboard.writeText(text ?? '')
            notify(okMsg, 'info')
        } catch {
            notify('클립보드 권한을 확인해주세요.', 'error')
        }
    }, [notify])

    const handleTranslate = useCallback(
        async (text?: string, forcedSourceType: 'ASR' | 'Direct' = 'Direct') => {
            const q = (text ?? input).trim()
            if (!q || isTranslating) return

            setIsTranslating(true)
            const sourceType = forcedSourceType
            setLastSourceType(sourceType)
            if (sourceType === 'Direct') setAsrInput('')

            try {
                const { data } = await api.post('/api/translate', {
                    text: q,
                    from_lang: 'ko',
                    to: targetLang
                })

                const result: string = data?.translated ?? ''
                setTranslated(result)

                const item: TranslationHistoryItem = {
                    id: Date.now().toString(),
                    original: q,
                    translated: result,
                    date: new Date().toISOString(),
                    targetLang,
                    source: sourceType
                }

                api.post('/translate/save_translation', {
                    id: item.id,
                    original: item.original,
                    translated: item.translated,
                    targetLang: item.targetLang,
                    source: item.source
                }).catch((e) => console.error('[번역 저장 실패]', e))

                onTranslate(item)
                setLastTranslatedTime(dtf ? dtf.format(new Date()) : new Date().toLocaleString())
                notify('번역이 완료되었습니다.', 'success')

                if (shouldSendLLM) {
                    const userMsgKo = q
                    const userMsgTarget = result

                    addMessage({
                        role: 'user',
                        message: userMsgTarget,
                        translatedMessage: userMsgKo,
                        name: 'You',
                        isFinal: true
                    })
                    send(userMsgTarget)
                    setLastSourceType('Direct')
                }
            } catch (err) {
                console.error('[번역 실패]', err)
                notify('번역 중 오류가 발생했습니다.', 'error')
            } finally {
                setIsTranslating(false)
            }
        },
        [api, input, targetLang, notify, shouldSendLLM, addMessage, send, onTranslate, dtf, isTranslating]
    )

    const onEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleTranslate()
        }
    }, [handleTranslate])

    return (
        <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-[inset_0_4px_20px_rgba(0,0,0,0.1)] border border-white/10 flex flex-col gap-6">
            <div className="flex w-full items-center gap-3">
                <textarea
                    className="flex-1 rounded-md border border-gray-300 p-3 bg-white/70 text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none shadow-sm"
                    rows={1}
                    placeholder="번역할 문장을 입력하세요... (Ctrl+Enter)"
                    spellCheck={false}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onEditorKeyDown}
                    aria-label="번역 입력"
                />

                <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={shouldSendLLM}
                        onChange={(e) => setShouldSendLLM(e.target.checked)}
                        className="sr-only peer"
                        aria-label='LLM 전송 여부'
                    />
                    <div className={clsx(
                        'w-9 h-5 rounded-full relative transition-colors',
                        'peer-focus-visible:ring-2 ring-indigo-300',
                        shouldSendLLM ? 'bg-indigo-500' : 'bg-gray-300'
                    )}>
                        <span className={clsx(
                            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                            shouldSendLLM ? 'translate-x-4' : 'translate-x-0'
                        )}/>
                    </div>
                    LLM 전송
                </label>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <div className="w-full md:w-[250px] lg:w-[270px]">
                    <TranslateCard
                        icon={
                            <div className="flex items-center gap-2">
                                <MessageSquareText className="w-4 h-4" />
                                <span
                                    className={clsx(
                                        'text-xs font-medium rounded px-1 py-0.5 border',
                                        lastSourceType === 'ASR'
                                            ? 'text-blue-600 bg-blue-100 border-blue-200'
                                            : lastSourceType === 'Direct'
                                                ? 'text-rose-600 bg-rose-100 border-rose-200'
                                                : 'text-gray-600 bg-gray-100 border-gray-200'
                                    )}
                                >
                                    {lastSourceType}
                                </span>
                            </div>
                        }
                        title="입력 텍스트"
                        content={lastSourceType === 'ASR' && asrInput ? asrInput : (input || '받은 텍스트가 없습니다.')}
                        className="h-full"
                    />
                </div>

                <div
                    className={clsx(
                        'relative w-full md:w-[250px] lg:w-[270px]',
                        'rounded-t-[32px] rounded-b-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-md',
                        activeTab === 'ASR' ? 'shadow-blue-200/40' : 'shadow-pink-200/40',
                        'font-MapoPeacefull'
                    )}
                >
                    <div className="absolute -top-4 left-0 flex items-center gap-1 bg-white/30 backdrop-blur-md rounded-full px-1 py-0.5 border border-white/50 shadow-sm z-20">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ASR')}
                            className={clsx(
                                'px-4 py-1.5 text-sm font-semibold rounded-full transition',
                                activeTab === 'ASR' ? 'bg-white text-blue-600 shadow shadow-blue-200' : 'text-black/80 hover:text-black'
                            )}
                            aria-pressed={activeTab === 'ASR'}
                        >
                            ASR
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('LLM')}
                            className={clsx(
                                'px-4 py-1.5 text-sm font-semibold rounded-full transition',
                                activeTab === 'LLM' ? 'bg-white text-pink-600 shadow shadow-pink-200' : 'text-black/80 hover:text-black'
                            )}
                            aria-pressed={activeTab === 'LLM'}
                        >
                            LLM
                        </button>
                    </div>

                    <div className="pt-8 px-5 pb-5 bg-white rounded-b-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Languages
                                className={clsx('w-5 h-5', activeTab === 'ASR' ? 'text-blue-500' : 'text-pink-500')}
                            />
                            <h3
                                className={clsx('text-sm font-bold', activeTab === 'ASR' ? 'text-blue-500' : 'text-pink-500')}
                            >
                                {activeTab === 'ASR' ? 'ASR 번역 결과' : 'LLM 번역 결과'}
                            </h3>
                        </div>

                        <div className="flex items-start gap-2">
                            <p
                                className="flex-1 text-sm leading-relaxed text-gray-800 font-MapoPeacefull overflow-hidden text-ellipsis whitespace-nowrap"
                                title={activeTab === 'ASR' ? translated : (lastAssistantMsg?.jaTranslatedMessage ?? '')}
                            >
                                {activeTab === 'ASR'
                                    ? (translated || '번역 결과 없음')
                                    : (lastAssistantMsg?.jaTranslatedMessage || 'LLM 결과 없음')}
                            </p>
                            <button
                                type="button"
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-white/70 hover:bg-white text-gray-800 border-white/60"
                                onClick={() =>
                                    copyToClipboard(
                                        activeTab === 'ASR'
                                            ? translated
                                            : (lastAssistantMsg?.jaTranslatedMessage ?? ''),
                                        '결과를 복사했습니다.'
                                    )
                                }
                            >
                                <ClipboardCopy className="w-4 h-4" />
                                복사
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-[230px] lg:w-[250px]">
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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-700 mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden />
                        마지막 번역 시각: {lastTranslatedTime || '—'}
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-700">번역 대상 언어</label>
                        <select
                            className="px-3 py-1.5 rounded-md bg-white/60 text-sm shadow-sm focus:outline-none"
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value as 'en' | 'ja' | 'zh')}
                            aria-label="번역 대상 언어"
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
                        type="button"
                        className={clsx(
                            'px-4 py-1.5 text-sm rounded-md text-white shadow inline-flex items-center gap-2',
                            isTranslating ? 'bg-blue-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'
                        )}
                        onClick={() => handleTranslate(input)}
                        disabled={isTranslating || !input.trim()}
                        aria-disabled={isTranslating || !input.trim()}
                        title="Ctrl/⌘+Enter 로도 실행됩니다"
                    >
                        {isTranslating && <Loader2 className="w-4 h-4 animate-spin" />}
                        번역
                    </button>
                    <button
                        type="button"
                        className="px-4 py-1.5 text-sm rounded-md bg-white/80 hover:bg-gray-300 text-gray-700 shadow border"
                        onClick={() => {
                            copyToClipboard(translated, '클립보드에 결과를 복사했습니다.')
                        }}
                        disabled={!translated}
                        aria-disabled={!translated}
                    >
                        복사
                    </button>
                </div>
            </div>
        </div>
    )
}