// app/llm/features/components/LLMTooltip.tsx
'use client'

import { ReactNode, useState, useRef } from 'react'

interface TooltipProps {
    children: ReactNode
    content: string
}

export default function Tooltip({ children, content }: TooltipProps) {
    const [visible, setVisible] = useState(false)
    const timer = useRef<number | null>(null)

    const show = () => {
        timer.current = window.setTimeout(() => setVisible(true), 100)
    }
    const hide = () => {
        if (timer.current !== null) {
            window.clearTimeout(timer.current)
        }
        setVisible(false)
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {visible && (
                <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-50"
                >
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                </div>
            )}
        </div>
    )
}