// app/llm/features/components/CharacterStatusCard.tsx
'use client'

import { useEmotionLabel } from '@/app/llm/hooks/useEmotionLabel'
import { useToneLabel } from '@/app/llm/hooks/useToneLabel'

interface Props {
    emotion?: string
    tone?: string
    blendshape?: string
}

export default function CharacterStatusCard({
    emotion,
    tone,
    blendshape
}: Props) {
    const emotionText = useEmotionLabel(emotion)
    const toneText = useToneLabel(tone)
    const blendshapeName = blendshape ?? 'Neutral'

    const statusTextMap: Record<string, string> = {
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
        default: '응답을 준비하고 있습니다.'
    }

    const statusText = statusTextMap[emotion ?? ''] || statusTextMap.default

    return (
        <div className="w-[260px] p-4 rounded-xl opacity-80 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 shadow-md space-y-3 text-white text-sm">

            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 shadow-sm">
                    <img
                        src="/assets/arielle.png"
                        alt="Arielle"
                        className="w-full h-full object-cover scale-[1.25] object-top"
                    />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-sm font-semibold text-white">Arielle</span>
                    <span className="text-xs text-white/60">대화 어시스턴트</span>
                </div>
            </div>

            <div>
                <span className="text-white/60">상태</span>{' '}
                <span className="text-yellow-300 font-medium">{emotionText}</span>
            </div>
            <div>
                <span className="text-white/60">응답 톤</span>{' '}
                <span className="text-blue-300 font-medium">{toneText}</span>
            </div>
            <div>
                <span className="text-white/60">표정 클립</span>{' '}
                <span className="text-pink-300 font-medium">{blendshapeName}</span>
            </div>
            
            <div className="text-xs text-white/50 pt-1">
                {statusText}
            </div>
    </div>
    )
}