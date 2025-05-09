// app/translate/features/components/TranslateAnalyticsPanel.tsx
'use client'

import { Star, BarChart3, MessageSquareQuote, Sparkles, Sparkle } from 'lucide-react'
import clsx from 'clsx'
import React from 'react'
import dynamic from 'next/dynamic'
import AnimatedNumber from './ui/AnimatedNumber'

interface Props {
    total: number
    llmRatio: number
    asrCount: number
    favoriteCount: number
    llmFeatureEnabled: boolean
}

const PieChartClient = dynamic(() => import('@/app/translate/features/components/charts/PieChartClient'), {
    ssr: false,
})

const COLORS = ['#ec4899', '#e5e7eb']

export default function TranslationAnalyticsPanel({ total, llmRatio, asrCount, favoriteCount, llmFeatureEnabled }: Props) {
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
        llmFeatureEnabled
            ? {
                icon: Sparkles,
                label: 'LLM 의역 비율',
                value: `${llmRatio}%`,
                color: 'text-pink-400',
                pie: true,
            }
            : {
                icon: Sparkles,
                label: 'LLM 의역 기능',
                value: '준비 중인 기능입니다.',
                color: 'text-pink-200',
                pie: false,
            },
        {
            icon: Star,
            label: '즐겨찾기 수',
            value: `${favoriteCount}개`,
            color: 'text-yellow-400',
        }
    ]

    const llmData = [
        { name: 'LLM', value: llmRatio },
        { name: 'Other', value: 100 - llmRatio },
    ]

    return (
        <div className="flex-[1.2] grid grid-cols-2 gap-4 gap-x-20 min-w-[360px]">
            {data.map(({ icon: Icon, label, value, color, pie }, i) => (
                <div
                    key={i}
                    className={clsx(
                        "p-4 rounded-xl min-w-[200px] border border-white/20 backdrop-blur-md",
                        "bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]",
                        "transition-all duration-300 hover:bg-white/20 hover:-translate-y-1",
                        !llmFeatureEnabled && label === 'LLM 기능' && 'opacity-70 grayscale'
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-full bg-white/20 flex items-center justify-center">
                            <Icon className={clsx('w-5 h-5', color)} />
                        </div>
                        <span className="text-gray-400 font-medium text-sm">{label}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-black text-[17px] font-semibold text-lg">
                            {!isNaN(Number(value)) ? (
                                <AnimatedNumber value={Number(value)} />
                            ) : (
                                value
                            )}
                        </span>
                        {pie && (
                            <div className="ml-2 flex items-center justify-center w-[36px] h-[36px]">
                                <PieChartClient llmRatio={llmRatio} />
                            </div>
                        )}
                    </div>
                </div>           
            ))}
        </div>
    )
}