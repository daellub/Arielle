// app/llm/features/components/ChatBubble.tsx
'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import clsx from 'clsx'
import { useLLMStore } from '../store/useLLMStore'
import { sendFeedback, type FeedbackRating } from '../services/feedback'

function useMessageAt(index: number) {
    return useLLMStore(
        (s) => s.messages[index],
        (a, b) => {
            if (a === b) return true
            if (!a || !b) return false
            return (
                a.role === b.role &&
                a.name === b.name &&
                a.interactionId === b.interactionId &&
                a.isFinal === b.isFinal &&
                a.feedback === b.feedback &&
                a.message === b.message &&
                a.translatedMessage === b.translatedMessage
            )
        }
    )
}

interface ChatBubbleProps {
    index: number
    lang: 'ko' | 'en'
}

function ChatBubbleBase({ index, lang }: ChatBubbleProps) {
    const messageObj = useMessageAt(index)
    const setFeedbackByIndex = useLLMStore((s) => s.setFeedbackByIndex)

    if (!messageObj) return null

    const isUser = messageObj.role === 'user'
    const { name, interactionId, isFinal, feedback } = messageObj

    const content = useMemo(() => {
        return lang === 'ko'
            ? messageObj.translatedMessage || messageObj.message
            : messageObj.message
    }, [lang, messageObj.message, messageObj.translatedMessage])

    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 30)
        return () => clearTimeout(t)
    }, [])

    const [displayed, setDisplayed] = useState('')
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (isUser || !visible || !isFinal || prefersReduced || content.length > 1200) {
            setDisplayed(content)
            return
        }

        let i = 0
        const step = () => {
            i += 2
            if (i >= content.length) {
                setDisplayed(content)
                rafRef.current && cancelAnimationFrame(rafRef.current)
                rafRef.current = null
                return
            }
            setDisplayed(content.slice(0, i))
            rafRef.current = requestAnimationFrame(step)
        }
        setDisplayed('')
        rafRef.current = requestAnimationFrame(step)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [content, isUser, isFinal, visible])

    const [pending, setPending] = useState<FeedbackRating | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const handleFeedback = useCallback(
        async (rating: FeedbackRating) => {
            if (!interactionId || feedback || pending) return
            setPending(rating)
            const prev = feedback
            setFeedbackByIndex(index, rating)
            try {
                abortRef.current?.abort()
                const ac = new AbortController()
                abortRef.current = ac
                await sendFeedback(interactionId, rating, ac.signal)
            } catch (e) {
                setFeedbackByIndex(index, prev ?? (null as any))
            } finally {
                setPending(null)
            }
        },
        [interactionId, feedback, pending, index, setFeedbackByIndex]
    )

    return (
        <div className={clsx('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={clsx(
                    'group flex flex-col max-w-[75%] space-y-1 transform transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
                    isUser ? 'items-end' : 'items-start'
                )}
            >
                {!isUser && name && (
                    <div className="text-sm text-[#d2baff] font-semibold drop-shadow-md px-1 animate-[floatGlow_3.5s_ease-in-out_infinite]">
                        {name}
                    </div>
                )}

                <div
                    className={clsx(
                        'px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap',
                        'rounded-[20px] backdrop-blur-md border transition-all duration-300 ease-in-out',
                        'border-white/10 text-white shadow-[0_8px_24px_rgba(180,160,255,0.12)]',
                        isUser
                            ? 'bg-gradient-to-br from-white/10 to-white/5 rounded-br-md'
                            : 'bg-gradient-to-br from-[#caaaff1a] to-[#dccbff0a] border-purple-100/20 rounded-bl-md'
                    )}
                >
                    {displayed}
                </div>

                {!isUser && (
                    <div className="flex items-center gap-2 mt-1 ml-1 text-xs text-gray-400 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                        <button
                            onClick={() => handleFeedback('up')}
                            disabled={!interactionId || Boolean(feedback) || pending === 'down'}
                            className={clsx(
                                'transition disabled:opacity-50 disabled:cursor-not-allowed',
                                feedback === 'up' ? 'text-green-500' : 'hover:text-green-500'
                            )}
                            aria-label="좋아요"
                            title="좋아요"
                        >
                            <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleFeedback('down')}
                            disabled={!interactionId || Boolean(feedback) || pending === 'up'}
                            className={clsx(
                                'transition disabled:opacity-50 disabled:cursor-not-allowed',
                                feedback === 'down' ? 'text-red-500' : 'hover:text-red-500'
                            )}
                            aria-label="별로예요"
                            title="별로예요"
                        >
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(ChatBubbleBase)