// app/llm/features/components/LLMTooltip.tsx
'use client'

import { ReactNode, useState, useRef } from 'react'
import clsx from 'clsx'

interface TooltipProps {
    children: ReactNode
    content: string
    delay?: number
}

export default function Tooltip({ children, content, delay = 150 }: TooltipProps) {
    const [visible, setVisible] = useState(false)
    const timer = useRef<number | null>(null)

    const show = () => {
        timer.current = window.setTimeout(() => setVisible(true), delay)
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
            <div
                role="tooltip"
                className={clsx(
                    "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1",
                    "px-2 py-1 rounded text-[10px] shadow-lg whitespace-nowrap z-50 transition-all",
                    visible 
                        ? "opacity-100 scale-100 bg-gray-800 text-white"
                        : "opacity-0 scale-95 pointer-events-none"
                )}
            >
                {content}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
            </div>
        </div>
    )
}