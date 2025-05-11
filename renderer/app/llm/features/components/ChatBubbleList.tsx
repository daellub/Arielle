// app/features/llm/components/ChatBubbleList.tsx
'use client'

import SparkParticlesContainer from './SparkParticlesContainer'
import StreamingIndicator from './StreamingIndicator'
import ChatBubble from './ChatBubble'

interface Props {
    language: 'ko' | 'en'
}

export default function ChatBubbleList({ language }: Props) {
    const dummyMessagesKo = [
        { role: 'assistant', message: '어서오세요, 주인님. 무엇을 도와드릴까요?', name: 'Arielle' },
        { role: 'user', message: '기분이 어때?' },
        { role: 'assistant', message: '기운차게 준비되어 있어요! 뭐든지 말씀만 해주세요.', name: 'Arielle' },
        { role: 'assistant', message: '정말 좋아요. 당신을 기다리고 있었어요!', name: 'Arielle' }
    ]

    const dummyMessagesEn = [
        { role: 'assistant', message: 'Welcome back. How can I help you today?', name: 'Arielle' },
        { role: 'user', message: 'How are you feeling?' },
        { role: 'assistant', message: "I'm ready to assist you with anything.", name: 'Arielle' },
        { role: 'assistant', message: 'I’m so glad. I’ve been waiting for you.', name: 'Arielle' }
    ]

    const dummyMessages = language === 'ko' ? dummyMessagesKo : dummyMessagesEn

    const isStreaming = true

    return (
        <div style={{ position: 'relative' }}>
            <SparkParticlesContainer />
            <div style={{ position: 'relative', zIndex: 1 }} className="flex flex-col space-y-5 px-2 py-2">
                {dummyMessages.map((msg, idx) => (
                    <ChatBubble
                        key={idx}
                        role={msg.role as 'user' | 'assistant'}
                        message={msg.message}
                        name={msg.name}
                    />
                ))}
                <StreamingIndicator visible={isStreaming} />
            </div>
        </div>
    )
}
