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
    }

export default function TranslateCard({ icon, title, content, color = 'text-gray-700', glow = false }: TranslateCardProps) {
    return (
        <div
            className={clsx(
                "rounded-xl p-4 w-full shadow-md border",
                glow ? "border-pink-500/50 shadow-pink-500/20" : "border-white/20"
            )}
        >
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <div className="p-1 bg-white/30 rounded-md">{icon}</div>
                <span className={clsx(color)}>{title}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-gray-800 font-medium whitespace-pre-wrap">
                {content}
            </p>
        </div>
    )
}
