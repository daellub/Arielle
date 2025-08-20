// app/llm/features/components/CharacterStatusCard.tsx
'use client'

import React, { memo, useMemo } from 'react'
import { Activity, MessageCircle, Sparkles } from 'lucide-react'
import { useEmotionLabel } from '@/app/llm/hooks/useEmotionLabel'
import { useToneLabel } from '@/app/llm/hooks/useToneLabel'

type Emotion =
    | 'joyful' | 'hopeful' | 'melancholic' | 'romantic' | 'peaceful' | 'nervous'
    | 'regretful' | 'admiring' | 'tense' | 'nostalgic' | 'whimsical' | 'sarcastic'
    | 'bitter' | 'apologetic' | 'affectionate' | 'solemn' | 'cheerful'
    | 'embarrassed' | 'contemplative'

const DEFAULT_STATUS = '응답을 준비하고 있습니다.'
const STATUS_TEXT_MAP: Record<Emotion, string> = {
    joyful: '기분 좋은 말들을 준비하고 있어요.',
    hopeful: '희망찬 말을 건네고 있어요.',
    melancholic: '조용히 생각을 정리하고 있어요.',
    romantic: '따뜻한 말을 건네려 해요.',
    peaceful: '고요한 마음으로 대화를 준비해요.',
    nervous: '조심스럽게 말을 고르고 있어요.',
    regretful: '사과할 말을 고민 중이에요.',
    admiring: '감탄의 말을 준비하고 있어요.',
    tense: '긴장 속에서도 말할 준비 중이에요.',
    nostalgic: '추억을 되새기고 있어요.',
    whimsical: '기발한 상상을 펼치는 중이에요.',
    sarcastic: '빈정거리려는 건 아니에요... 아마도?',
    bitter: '조금은 씁쓸한 말을 떠올리는 중이에요.',
    apologetic: '진심을 담아 표현하려고 해요.',
    affectionate: '다정한 말을 준비하고 있어요.',
    solemn: '엄숙하게 말하려고 해요.',
    cheerful: '활기찬 분위기를 띄우려 해요.',
    embarrassed: '살짝 부끄러운 말을 준비하고 있어요.',
    contemplative: '깊이 생각하고 있어요.',
} as const

function getStatusText(e?: string): string {
    return (e && (e as Emotion) in STATUS_TEXT_MAP)
        ? STATUS_TEXT_MAP[e as Emotion]
        : DEFAULT_STATUS
}

function toTitle(s?: string, fallback = 'Neutral') {
    if (!s) return fallback
    return s.charAt(0).toUpperCase() + s.slice(1)
}

interface Props {
    emotion?: string
    tone?: string
    blendshape?: string
}

function Badge({
    toneClass,
    children,
    icon,
    label,
}: {
    toneClass: string
    children: React.ReactNode
    icon: React.ReactNode
    label: string
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-white/65">{label}</span>
            <span
                className={[
                    'inline-flex items-center gap-1 rounded-md px-2 py-0.5',
                    'text-xs font-medium ring-1',
                    toneClass,
                ].join(' ')}
            >
                {icon}
                {children}
            </span>
        </div>
    )
}

function CharacterStatusCardBase({ emotion, tone, blendshape }: Props) {
    const emotionText = useEmotionLabel(emotion)
    const toneText = useToneLabel(tone)
    const blendshapeName = toTitle(blendshape)

    const statusText = useMemo(() => getStatusText(emotion), [emotion])

    return (
        <div className="relative w-[260px]">
            <div className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-300/30 via-white/10 to-fuchsia-300/30">
                <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4 space-y-3 text-white/90 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-[2px] rounded-full bg-gradient-to-br from-indigo-300/50 to-fuchsia-300/50">
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-sm">
                                <img
                                    src="/assets/arielle.png"
                                    alt="Arielle"
                                    className="w-full h-full object-cover scale-[1.25] object-top"
                                    loading="lazy"
                                    decoding="async"
                                    fetchPriority="low"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col justify-center">
                            <span className="text-sm font-semibold text-white">Arielle</span>
                            <span className="text-xs text-white/60">대화 어시스턴트</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Badge
                            label="상태"
                            toneClass="bg-yellow-400/10 text-yellow-300 ring-yellow-400/25"
                            icon={<Activity className="size-3" strokeWidth={1.75} />}
                        >
                            {emotionText}
                        </Badge>

                        <Badge
                            label="응답 톤"
                            toneClass="bg-sky-400/10 text-sky-300 ring-sky-400/25"
                            icon={<MessageCircle className="size-3" strokeWidth={1.75} />}
                        >
                            {toneText}
                        </Badge>

                        <Badge
                            label="표정 클립"
                            toneClass="bg-pink-400/10 text-pink-300 ring-pink-400/25"
                            icon={<Sparkles className="size-3" strokeWidth={1.75} />}
                        >
                            {blendshapeName}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(CharacterStatusCardBase)