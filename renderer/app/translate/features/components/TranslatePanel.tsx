// app/translate/features/components/TranslateSummarySection.tsx

'use client'

import { MessageSquareText, Languages, Sparkles } from 'lucide-react'
import TranslateCard from './TranslateCard'

export default function TranslateSummarySection() {
    return (
        <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-inner border border-white/10 overflow-hidden flex flex-col gap-6">
            {/* 상단 번역 카드들 */}
            <div className="flex flex-col lg:flex-row gap-4">
                <TranslateCard
                    icon={<MessageSquareText className="w-4 h-4" />}
                    title="입력 텍스트"
                    content="안녕하세요. 반갑습니다."
                />
                <TranslateCard
                    icon={
                        <div className="flex items-center gap-1">
                            <Languages className="w-4 h-4" />
                            <span className="text-xs text-blue-400 font-medium border border-blue-400/30 rounded px-1 py-0.5 bg-blue-400/10">ASR</span>
                        </div>
                    }
                    title="ASR 번역 결과"
                    content="Hello. Nice to meet you."
                    color="text-blue-500"
                />
                <TranslateCard
                    icon={<Sparkles className="w-4 h-4" />}
                    title="LLM 의역 결과"
                    content="Hi there! Great to see you."
                    color="text-pink-500"
                    glow
                />
            </div>

            {/* 하단 액션 영역 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        마지막 번역 시각: 2025.05.07 00:05:12
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-600">번역 대상 언어</label>
                        <select className="px-3 py-1.5 rounded-md bg-white/60 text-sm shadow-sm focus:outline-none">
                            <option value="en">영어</option>
                            <option value="ja">일본어</option>
                            <option value="zh">중국어</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="px-4 py-1.5 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white shadow">
                        재번역
                    </button>
                    <button className="px-4 py-1.5 text-sm rounded-md bg-white/80 hover:bg-white text-gray-700 shadow border">
                        복사
                    </button>
                </div>
            </div>
        </div>
    )
}