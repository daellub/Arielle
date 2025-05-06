// app/translate/features/components/TranslationAnalyticsPanel.tsx
'use client'

import { BarChart3, MessageSquareQuote, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import React from 'react'

interface Props {
    total: number
    llmRatio: number
    asrCount: number
}

export default function TranslationAnalyticsPanel({ total, llmRatio, asrCount }: Props) {
    const data = [
        {
            icon: BarChart3,
            label: '총 번역 수',
            value: `${total}개`,
            color: 'text-blue-400',
        },
        {
            icon: MessageSquareQuote,
            label: 'ASR 번역 수',
            value: `${asrCount}개`,
            color: 'text-purple-400',
        },
        {
            icon: Sparkles,
            label: 'LLM 의역 비율',
            value: `${llmRatio}%`,
            color: 'text-pink-400',
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(({ icon: Icon, label, value, color }, i) => (
                <div
                    key={i}
                    className="flex flex-col gap-2 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] hover:bg-white/20 transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Icon className={clsx('w-5 h-5', color)} />
                        <span className="text-sm text-gray-500 font-medium">{label}</span>
                    </div>
                    <div className="text-xl font-bold text-black">{value}</div>
                </div>
            ))}
        </div>
    )
}
