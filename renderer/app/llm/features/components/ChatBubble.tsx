// app/llm/features/components/ChatBubble.tsx
'use client'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import clsx from 'clsx'
import { useLLMStore } from '../store/useLLMStore'

interface ChatBubbleProps {
    index: number
    lang: 'ko' | 'en'
}

export default function ChatBubble({ index, lang }: ChatBubbleProps) {
    const messageObj = useLLMStore((s) => s.messages[index])
    const isUser = messageObj.role === 'user'
    const { name, interactionId, isFinal, feedback } = messageObj
    const [visible, setVisible] = useState(false)
    const [displayed, setDisplayed] = useState('')

    const content = 
        lang === 'ko'
            ? messageObj.translatedMessage || messageObj.message
            : messageObj.message

    // useEffect(() => {
    //     console.log(`[ChatBubble] index=${index}, lang=${lang}, content=`, content)
    // }, [content, index, lang])

    const handleFeedback = async (rating: 'up' | 'down') => {
        if (!interactionId || feedback) return

        await axios.post('http://localhost:8000/llm/feedback', {
            interaction_id: interactionId,
            rating,
            tone_score: rating === 'up' ? 1.0 : 0.0
        })

        useLLMStore.setState((state) => {
            const updated = [...state.messages]
            if (updated[index]) updated[index].feedback = rating
            return { messages: updated }
        })
    }

    useEffect(() => {
        const timeout = setTimeout(() => setVisible(true), 50)
        return () => clearTimeout(timeout)
    }, [])

    useEffect(() => {
    if (isUser || !visible || !isFinal) {
            setDisplayed(content)
            return
        }

        let i = 0
        const interval = setInterval(() => {
            i++
            setDisplayed(content.slice(0, i))
            if (i >= content.length) clearInterval(interval)
        }, 15)

        return () => clearInterval(interval)
    }, [visible, content, isUser, isFinal])

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={clsx(
                    'flex flex-col max-w-[75%] space-y-1 transform transition-all duration-700',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
                    isUser ? 'items-end' : 'items-start'
                )}
            >
                {!isUser && name && (
                    <div
                        className="text-sm text-[#d2baff] font-semibold drop-shadow-md px-1"
                        style={{ animation: 'floatGlow 3.5s ease-in-out infinite' }}
                    >
                        {name}
                    </div>
                )}

                <div
                    className={`
                        px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap
                        rounded-[24px] backdrop-blur-md border
                        transition-all duration-300 ease-in-out
                        border-white/10 text-white animate-fade-in animate-soft-pulse
                        shadow-[0_8px_24px_rgba(180,160,255,0.12)]
                        ${isUser
                            ? 'bg-gradient-to-br from-white/10 to-white/5 rounded-br-md'
                            : 'bg-gradient-to-br from-[#caaaff1a] to-[#dccbff0a] border-purple-100/20 rounded-bl-md'
                        }
                    `}
                >
                    {displayed}
                </div>

                {!isUser && (
                    <div className="flex items-center gap-2 mt-1 ml-1 text-xs text-gray-400">
                        <button
                            onClick={() => handleFeedback('up')}
                            className={clsx(
                                'transition',
                                feedback === 'up' ? 'text-green-500' : 'hover:text-green-500'
                            )}
                        >
                            <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleFeedback('down')}
                            className={clsx(
                                'transition',
                                feedback === 'down' ? 'text-red-500' : 'hover:text-red-500'
                            )}
                        >
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

