// app/llm/features/components/StreamingIndicator.tsx
'use client'

import React, { memo } from 'react'
import clsx from 'clsx'

interface Props {
    visible: boolean
    className?: string
}

function StreamingIndicator({ visible, className }: Props) {
    if (!visible) return null

    return (
        <div
            role="status"
            aria-live="polite"
            className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-white/5 backdrop-blur-sm border border-white/10',
                'text-[13px] font-medium text-[#ddd3ff] opacity-90',
                'shadow-[0_6px_24px_rgba(160,140,255,0.18)]',
                className
            )}
        >
            <span>아리엘이 응답 중입니다</span>
            <span className="relative inline-block w-[18px] overflow-hidden align-middle">
                <span className="dots font-mono tracking-[0.2em]">...</span>
            </span>

            <style jsx>{`
                .dots {
                    display: inline-block;
                    width: 0ch;
                    animation: ellipsis 1s steps(4, end) infinite;
                }
                @keyframes ellipsis {
                    0%   { width: 0ch; }
                    25%  { width: 1ch; }
                    50%  { width: 2ch; }
                    75%  { width: 3ch; }
                    100% { width: 0ch; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .dots { animation: none; width: 3ch; }
                }
            `}</style>
        </div>
    )
}

export default memo(StreamingIndicator) 