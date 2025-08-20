// app/translate/features/components/TranslateAnalyticsPanel.tsx
'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import clsx from 'clsx'
import { Star, BarChart3, MessageSquareQuote, Sparkles, Ban } from 'lucide-react'
import AnimatedNumber from './ui/AnimatedNumber'

const PieChartClient = dynamic(
    () => import('@/app/translate/features/components/charts/PieChartClient'),
    { ssr: false }
)

interface Props {
    total: number
    llmRatio: number
    asrCount: number
    favoriteCount: number
    llmFeatureEnabled: boolean
}

function clampPercent(n: number) {
    if (!Number.isFinite(n)) return 0
    return Math.min(100, Math.max(0, n))
}

function formatInt(n: number) {
    try {
        return new Intl.NumberFormat().format(n ?? 0)
    } catch {
        return String(n ?? 0)
    }
}

type StatItem =
    | {
        key: string
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
        label: string
        type: 'count'
        value: number
        color: string
    }
    | {
        key: string
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
        label: string
        type: 'ratio'
        value: number
        color: string
        pie: boolean
        enabled: boolean
    }

const Card: React.FC<{
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
    color: string
    children: React.ReactNode
    disabled?: boolean
}> = ({ icon: Icon, label, color, children, disabled }) => (
    <div
        className={clsx(
            'p-4 rounded-xl min-w-[200px] border backdrop-blur-md',
            'bg-white/55 border-white/40 shadow-[0_8px_28px_0_rgba(31,38,135,0.18)]',
            'transition-all duration-300 hover:bg-white/70 hover:-translate-y-0.5',
            disabled && 'opacity-70 grayscale'
        )}
        aria-disabled={disabled || undefined}
    >
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-white/50 border border-white/60 flex items-center justify-center">
                <Icon className={clsx('w-5 h-5', color)} />
            </div>
            <span className="text-gray-600 font-medium text-sm">{label}</span>
        </div>
        {children}
    </div>
)

export default function TranslationAnalyticsPanel({
    total,
    llmRatio,
    asrCount,
    favoriteCount,
    llmFeatureEnabled
}: Props) {
    const ratio = clampPercent(llmRatio || 0)

    const stats = useMemo<StatItem[]>(
        () => [
            {
                key: 'total',
                icon: BarChart3,
                label: '총 번역 수',
                type: 'count',
                value: total ?? 0,
                color: 'text-blue-500'
            },
            {
                key: 'asr',
                icon: MessageSquareQuote,
                label: 'ASR 번역 수',
                type: 'count',
                value: asrCount ?? 0,
                color: 'text-purple-500'
            },
            llmFeatureEnabled
                ? {
                    key: 'llm',
                    icon: Sparkles,
                    label: 'LLM 의역 비율',
                    type: 'ratio',
                    value: ratio,
                    color: 'text-pink-500',
                    pie: true,
                    enabled: true
                } : {
                    key: 'llm-disabled',
                    icon: Sparkles,
                    label: 'LLM 의역 기능',
                    type: 'ratio',
                    value: 0,
                    color: 'text-pink-300',
                    pie: false,
                    enabled: false
                },
            {
                key: 'fav',
                icon: Star,
                label: '즐겨찾기 수',
                type: 'count',
                value: favoriteCount ?? 0,
                color: 'text-yellow-500'
            }
        ],
        [total, asrCount, ratio, favoriteCount, llmFeatureEnabled]
    )

    return (
        <section
            className="grid grid-cols-2 gap-x-20 gap-y-4 w-full"
            aria-label="번역 통계"
        >
            {stats.map((s) => {
                if (s.type === 'count') {
                    return (
                        <Card key={s.key} icon={s.icon} label={s.label} color={s.color}>
                            <div className="flex items-center justify-between">
                                <span
                                    className="text-black text-[17px] font-semibold"
                                    aria-live="polite"
                                    aria-label={`${s.label} ${formatInt(s.value)}개`}
                                >
                                    <AnimatedNumber value={s.value} decimals={0} suffix="개" />
                                </span>
                            </div>
                        </Card>
                    )
                }

                return (
                    <Card
                        key={s.key}
                        icon={s.icon}
                        label={s.label}
                        color={s.color}
                        disabled={!s.enabled}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-black text-[17px] font-semibold"
                                aria-live="polite"
                                aria-label={`${s.label} ${s.value}%`}
                            >
                                <AnimatedNumber value={s.value} decimals={0} suffix="%" />
                            </span>

                            <div className="ml-2 flex items-center justify-center w-[36px] h[36px]">
                                {s.pie ? (
                                    <PieChartClient llmRatio={s.value} />
                                ) : (
                                    <div
                                        className="relative w-[36px] h-[36px] rounded-full border-2 border-dashed border-pink-200/70 grid place-items-center"
                                        title="준비 중인 기능입니다."
                                    >
                                        <Ban className="w-3.5 h-3.5 text-pink-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )
            })}
        </section>
    )
}