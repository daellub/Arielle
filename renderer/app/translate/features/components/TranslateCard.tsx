// app/translate/features/components/TranslateCard.tsx
'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

interface TranslateCardProps {
    icon: ReactNode
    title: string
    content: string
    color?: string
    glow?: boolean
    className?: string
}

export default function TranslateCard({ icon, title, content, color = 'text-gray-700', glow = false, className }: TranslateCardProps) {
    return (
        <div
            className={clsx(
                "p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                "bg-white/5 backdrop-blur-md",
                glow ? "border-pink-500/50 shadow-pink-500/30" : "border-white/10 shadow-md border rounded-xl",
                className
            )}
        >
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <div className="p-2 rounded-full bg-white/20 flex items-center justify-center">{icon}</div>
                <span className={clsx(color)}>{title}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-gray-800 font-medium whitespace-pre-wrap">
                {content}
            </p>
        </div>
    )
}
