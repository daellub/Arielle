// app/features/llm/components/EmotionStatusCard.tsx
'use client'

export default function EmotionStatusCard() {
    return (
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md p-5 text-[#1a1a1a] space-y-2">
            <p className="text-sm font-semibold text-gray-800">현재 감정 상태</p>

            <div className="flex items-center gap-3">
                <span className="text-3xl">😊</span>
                <div>
                    <p className="text-base font-semibold">기쁨</p>
                    <p className="text-xs text-gray-500">Arielle은 지금 기분이 좋아요.</p>
                </div>
            </div>
        </div>
    )
}
