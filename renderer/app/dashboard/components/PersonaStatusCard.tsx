// app/dashboard/components/PersonaStatusCard.tsx
'use client'

import { memo, useMemo } from 'react'
import { Activity, MessageCircle, Sparkles } from 'lucide-react'
import clsx from 'clsx'

type Emotion =
    | 'joyful' | 'hopeful' | 'melancholic' | 'romantic' | 'peaceful' | 'nervous'
    | 'regretful' | 'admiring' | 'tense' | 'nostalgic' | 'whimsical' | 'sarcastic'
    | 'bitter' | 'apologetic' | 'affectionate' | 'solemn' | 'cheerful'
    | 'embarrassed' | 'contemplative' | 'neutral'

const EMOJI: Record<Emotion, string> = {
    joyful: '😊', hopeful: '🌤️', melancholic: '🌧️', romantic: '💞', peaceful: '🕊️', nervous: '😬',
    regretful: '🙇', admiring: '👏', tense: '😰', nostalgic: '📼', whimsical: '🎈', sarcastic: '😏',
    bitter: '😒', apologetic: '🙏', affectionate: '🤗', solemn: '🎗️', cheerful: '😁',
    embarrassed: '😳', contemplative: '🧠', neutral: '🙂'
}

const STATUS_TEXT: Partial<Record<Emotion, string>> = {
    joyful: '기분 좋은 말을 준비 중',
    hopeful: '희망 섞인 한마디를 고르는 중',
    melancholic: '조용히 생각을 정리하는 중',
    peaceful: '차분히 대화를 준비하는 중',
    nervous: '조심스럽게 어휘를 고르는 중',
    contemplative: '깊이 생각하는 중',
    neutral: '응답을 준비하고 있습니다.'
}

function toTitle(s?: string, fallback = 'Neutral') {
    if (!s) return fallback
    return s.charAt(0).toUpperCase() + s.slice(1)
}

export default memo(function PersonaStatusCard({
    avatarSrc,
    name,
    role,
    emotion = 'neutral',
    tone = '정중체',
    blendshape = 'Neutral',
}: {
    avatarSrc?: string
    name?: string
    role?: string
    emotion?: Emotion | string
    tone?: string
    blendshape?: string
}) {
    const e = (typeof emotion === 'string' && (EMOJI as any)[emotion]) ? (emotion as Emotion) : 'neutral'
    const titleBlend = toTitle(blendshape)

    const statusText = useMemo(() => STATUS_TEXT[e] ?? STATUS_TEXT.neutral!, [e])

    return (
        <div className="flex gap-3 items-start">
            <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shadow">
                    {avatarSrc
                        ? <img src={avatarSrc} alt={name ?? 'persona'} className="w-full h-full object-cover" />
                        : <div className="w-full h-full grid place-items-center bg-white/5">{EMOJI[e]}</div>}
                </div>
                <span className="absolute -bottom-1 -right-1 text-xs select-none">{EMOJI[e]}</span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{name ?? 'Persona'}</div>
                <div className="text-xs text-white/60">{role ?? 'AI Companion'}</div>

                <div className="mt-3 grid gap-2">
                    <Badge icon={<Activity className="w-3 h-3" />} label="상태" tone="amber">{statusText}</Badge>
                    <Badge icon={<MessageCircle className="w-3 h-3" />} label="응답 톤" tone="sky">{tone}</Badge>
                    <Badge icon={<Sparkles className="w-3 h-3" />} label="표정 클립" tone="pink">{titleBlend}</Badge>
                </div>
            </div>
        </div>
    )
})

function Badge({
    icon,
    label,
    tone,
    children,
}: {
    icon: React.ReactNode
    label: string
    tone: 'amber' | 'sky' | 'pink'
    children: React.ReactNode
}) {
    const toneCls =
        tone === 'amber' ? 'bg-amber-400/10 text-amber-200 ring-amber-300/30' :
        tone === 'sky'   ? 'bg-sky-400/10 text-sky-200 ring-sky-300/30' :
                        'bg-pink-400/10 text-pink-200 ring-pink-300/30'
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="text-white/65">{label}</span>
            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md ring-1', toneCls)}>
                {icon}{children}
            </span>
        </div>
    )
}
