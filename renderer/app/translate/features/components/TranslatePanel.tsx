// components/ui/TranslatePanel.tsx

import { MessageSquareText, Languages, Sparkles } from 'lucide-react'
import TranslateCard from './TranslateCard'

export default function TranslatePanel() {
    return (
        <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-inner border border-white/10">
            <div className="flex items-start gap-6 justify-start">
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
        </div>
    )
}
