// app/features/llm/components/ChatBubbleList.tsx
'use client'

import SparkParticlesContainer from './SparkParticlesContainer'
import StreamingIndicator from './StreamingIndicator'
import ChatBubble from './ChatBubble'

import { useLLMStore } from '@/app/llm/features/store/useLLMStore'

interface Props {
    language: 'ko' | 'en'
}

export default function ChatBubbleList({ language }: Props) {
    const messages = useLLMStore((state) => state.messages)
    const isStreaming = true

    return (
        <div style={{ position: 'relative' }}>
            <SparkParticlesContainer />
            <div style={{ position: 'relative', zIndex: 1 }} className="flex flex-col space-y-5 px-2 py-2">
                {messages.map((_, idx) => (
                    <ChatBubble key={idx} index={idx} lang={language} />
                ))}
                <StreamingIndicator visible={isStreaming} />
            </div>
        </div>
    )
}
