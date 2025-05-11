// app/features/llm/components/ToneCard.tsx
'use client'

export default function ToneCard() {
    return (
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md p-5 text-[#1a1a1a] space-y-2">
            <p className="text-sm font-semibold text-gray-800">현재 말투 스타일</p>

            <div className="mt-2 flex flex-wrap gap-2">
                {/* 선택된 말투만 강조 */}
                <span className="px-3 py-1 rounded-full bg-[#547bcb]/10 text-[#547bcb] text-sm font-medium shadow-sm">
                    정중체
                </span>

                {/* 나머지는 비활성화 or 회색 */}
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm">친근체</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm">츤데레</span>
            </div>
        </div>
    )
}
