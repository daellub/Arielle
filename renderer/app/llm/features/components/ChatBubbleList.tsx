// app/features/llm/components/ChatBubbleList.tsx
'use client'

import SparkParticlesContainer from './SparkParticlesContainer'
import StreamingIndicator from './StreamingIndicator'
import ChatBubble from './ChatBubble'
import { useEffect, useRef } from 'react'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'

interface Props {
    language: 'ko' | 'en'
}

export default function ChatBubbleList({ language }: Props) {
    const messages = useLLMStore((state) => state.messages)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        setTimeout(() => {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        }, 30)
    }, [messages])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        setTimeout(() => {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        }, 50)
    }, [language])

    return (
        <div style={{ position: 'relative' }}>
            <SparkParticlesContainer />
            <div
                ref={scrollRef}
                className="scrollLLMArea max-h-[475px] overflow-y-auto flex flex-col space-y-5 px-2 py-2 pr-4"
            >
                {messages.map((_, idx) => (
                    <ChatBubble key={idx} index={idx} lang={language} />
                ))}
                <StreamingIndicator visible={true} />
            </div>
        </div>
    )
}
