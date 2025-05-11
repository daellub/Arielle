// app/llm/features/components/ChatBubble.tsx
'use client'

import { useEffect, useState } from 'react'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  message: string
  name?: string
}

export default function ChatBubble({ role, message, name }: ChatBubbleProps) {
  const isUser = role === 'user'
  const [visible, setVisible] = useState(false)
  const [displayed, setDisplayed] = useState('')

  // 등장 애니메이션 활성화
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timeout)
  }, [])

  // 타이핑 효과 (assistant만)
  useEffect(() => {
    if (isUser || !visible) {
      setDisplayed(message) // 유저 메시지는 바로 출력
      return
    }

    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(message.slice(0, i))
      if (i >= message.length) clearInterval(interval)
    }, 15)

    return () => clearInterval(interval)
  }, [visible, message, isUser])

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          flex flex-col max-w-[75%] space-y-1 transform transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          ${isUser ? 'items-end' : 'items-start'}
        `}
      >
        {/* 이름 (assistant만) */}
        {!isUser && name && (
          <div
            className="text-sm text-[#d2baff] font-semibold drop-shadow-md px-1"
            style={{ animation: 'floatGlow 3.5s ease-in-out infinite' }}
          >
            {name}
          </div>
        )}

        {/* 말풍선 */}
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
      </div>
    </div>
  )
}

