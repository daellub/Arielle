// app/features/llm/components/LLMSystemStats.tsx
'use client'

import {
    Atom,
    AlignStartVertical,
    Flame,
    SquareFunction,
    Repeat,
    Timer,
    Server,
} from 'lucide-react'

import { useLLMSettingsStore } from '@/app/llm/features/store/llmSettingsStore'
import useMemoryStore from '@/app/llm/features/store/useMemoryStore'
import useSamplingStore from '@/app/llm/features/store/useSamplingStore'

export default function LLMStatusCard() {
    const maxTokens = useMemoryStore(state => state.maxTokens)

    const temperature = useSamplingStore(state => state.temperature)
    const topK = useSamplingStore(state => state.topK)
    const topP = useSamplingStore(state => state.topP)
    const repetitionPenalty = useSamplingStore(state => state.repetitionPenalty)

    const {
        modelName,
        responseTime,
        device,
    } = useLLMSettingsStore()

    return (
        <div className="w-[260px] p-4 rounded-2xl bg-[#1f1f2d]/60 backdrop-blur-md border border-white/10 shadow-sm text-white space-y-4">
            <div>
            <div className="flex items-center gap-2 text-xs uppercase text-white/60">
                <Atom className="w-4 h-4 text-indigo-300" />
                모델 연산체
            </div>
                <div className="text-lg font-bold text-indigo-300 mt-1">{modelName}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat icon={<AlignStartVertical className="w-4 h-4 text-indigo-300" />} label="문장 범위" value={`${maxTokens} tokens`} />
                <Stat icon={<Flame className="w-4 h-4 text-indigo-300" />} label="감정 진폭" value={temperature} />
                <Stat icon={<SquareFunction className="w-4 h-4 text-indigo-300" />} label="top_k" value={topK} />
                <Stat icon={<SquareFunction className="w-4 h-4 text-indigo-300" />} label="top_p" value={topP} />
                <Stat icon={<Repeat className="w-4 h-4 text-indigo-300" />} label="반복 억제" value={repetitionPenalty} />
                <Stat icon={<Timer className="w-4 h-4 text-indigo-300" />} label="응답 속도" value={`${responseTime}s`} />
            </div>

            <div>
                <div className="flex items-center gap-2 text-xs uppercase text-white/60 mb-1">
                    <Server className="w-4 h-4 text-indigo-300" />
                    디바이스
                </div>
                <div className="text-white text-sm">{device}</div>
            </div>
        </div>
    )
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string
    value: string | number
    icon: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-white/60">
                {icon}
                {label}
            </div>
            <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md text-xs font-medium w-fit">
                {value}
            </span>
        </div>
    )
}