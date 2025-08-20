// app/llm/features/components/LLMDebugInputPanel.tsx
'use client'

import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Send, RefreshCw, Wifi, WifiOff, CircleStop, Loader2, Volume2, VolumeX } from 'lucide-react'
import { useLLMStream } from '@/app/llm/hooks/useLLMStream'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'
import { toast } from '@/app/common/toast/useToastStore'

type Props = {
    maxWidth?: number
    dense?: boolean
    inputMaxWidth?: number
}

const MIN_H = 36
const MAX_H = 120
function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(Math.max(el.scrollHeight, MIN_H), MAX_H) + 'px'
}

function LLMDebugInputPanelBase({ maxWidth = 600, dense = true, inputMaxWidth = 430 }) {
    const [input, setInput] = useState('')
    const [isComposing, setIsComposing] = useState(false)
    const taRef = useRef<HTMLTextAreaElement | null>(null)

    const { send, isConnected, reconnect, stop } = useLLMStream()
    const addMessage = useLLMStore((s) => s.addMessage)
    const streaming = useLLMStore((s) => s.streaming)
    const autoSpeakEnabled = useLLMStore((s) => s.autoSpeakEnabled)
    const setAutoSpeakEnabled = useLLMStore((s) => s.setAutoSpeakEnabled)

    useEffect(() => {
        if (taRef.current) autoGrow(taRef.current)
    }, [input])

    const doSend = useCallback(() => {
        const trimmed = input.trim()
        if (!trimmed) {
            toast.info({ key: 'empty-input', title: '입력 없음', description: '보낼 내용을 입력해 주세요.', compact: true, duration: 1600 })
            return
        }
        addMessage({ role: 'user', message: trimmed })
        send(trimmed)
        setInput('')
        if (taRef.current) {
            taRef.current.style.height = '40px'
            taRef.current.focus()
        }
    }, [input, addMessage, send])

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (isComposing) return
            const isCmdOrCtrl = e.metaKey || e.ctrlKey
            if ((isCmdOrCtrl && e.key === 'Enter') || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault()
                doSend()
            }
        },
        [doSend, isComposing]
    )

    const toggleTTS = useCallback(() => {
        setAutoSpeakEnabled(!autoSpeakEnabled)
    }, [autoSpeakEnabled, setAutoSpeakEnabled])

    return (
        <div className="mt-3 w-full">
            <div
                className={clsx(
                    'mx-auto rounded-xl border border-white/10',
                    'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md',
                    'shadow-[0_6px_18px_rgba(180,160,255,0.10)]',
                    dense ? 'px-3 py-2' : 'px-4 py-3'
                )}
                style={{ maxWidth }}
            >
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <span className="inline-flex items-center gap-1 text-emerald-300 text-[11px] font-medium">
                                <Wifi className="w-3.5 h-3.5" /> 연결됨
                            </span>
                        ) : (
                            <>
                                <span className="inline-flex items-center gap-1 text-rose-300 text-[11px] font-medium">
                                    <WifiOff className="w-3.5 h-3.5" /> 연결 끊김
                                </span>
                                <button
                                    onClick={reconnect}
                                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-white/90 bg-white/10 hover:bg-white/15 border border-white/15 transition"
                                    title="재연결"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> 재연결
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
                        className={clsx(
                            'inline-flex items-center gap-1.5 rounded-md border transition',
                            autoSpeakEnabled
                                ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-100 hover:bg-indigo-500/25'
                                : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15',
                            'px-2 py-0.5 text-[11px]'
                        )}
                        aria-pressed={autoSpeakEnabled}
                        title="TTS 자동 재생"
                    >
                        {autoSpeakEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        TTS
                    </button>
                </div>

                <div
                    className={clsx(
                        'relative grid grid-cols-[1fr_auto] items-center gap-2',
                        'rounded-lg border border-white/10 bg-white/5 overflow-hidden',
                        'focus-within:ring-2 focus-within:ring-white/30 focus-within:border-white/30 transition',
                        'justify-items-start'
                    )}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-0 h-full w-[5px]"
                        style={{ background: 'linear-gradient(180deg, rgba(204,180,255,.35), rgba(150,180,255,.35))' }}
                    />

                    <div className='min-w-0 w-full' style={{ maxWidth: inputMaxWidth }}>
                        <textarea
                            ref={taRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            placeholder="메시지를 입력하세요..."
                            className={clsx(
                                'scrollLLMArea w-full resize-none bg-transparent outline-none text-white placeholder-white/50',
                                'leading-[1.35] overflow-y-auto',
                                dense ? 'text-[13px] px-3 py-2 min-h-[34px] max-h-[96px]' : 'text-sm px-3 py-2.5'
                            )}
                        />
                    </div>

                    <div className={clsx('pr-1 self-center')}>
                        {streaming ? (
                            <button
                                onClick={stop}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-rose-500 hover:bg-rose-600 text-white border border-white/10 transition"
                                title="스트리밍 중지"
                            >
                                <CircleStop className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    const trimmed = input.trim()
                                    if (!trimmed) return
                                    addMessage({ role: 'user', message: trimmed })
                                    send(trimmed)
                                    setInput('')
                                    if (taRef.current) { taRef.current.style.height = MIN_H + 'px'; taRef.current.focus() }
                                }}
                                disabled={!input.trim()}
                                className={clsx(
                                    'inline-flex items-center justify-center w-9 h-9 rounded-md border border-white/10 transition',
                                    input.trim()
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-white/10 text-white/60 cursor-not-allowed'
                                )}
                                title="전송"
                            >
                                {isConnected ? <Send className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(LLMDebugInputPanelBase)