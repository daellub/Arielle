// app/llm/features/components/CharacterStatusCard.tsx
'use client'

'use client'

interface Props {
    emotion?: string
    tone?: string
}

export default function CharacterStatusCard({
    emotion = '😊 밝음',
    tone = '정중체'
}: Props) {
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
                <span className="text-yellow-300 font-medium">😊 밝음</span>
            </div>
            <div>
                <span className="text-white/60">응답 톤</span>{' '}
                <span className="text-blue-300 font-medium">정중체</span>
            </div>

            <div className="text-xs text-white/50 pt-1">
                응답을 준비하고 있습니다.
            </div>
    </div>
    )
}