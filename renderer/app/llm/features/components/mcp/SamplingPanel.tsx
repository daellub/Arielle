'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

export default function SamplingPanel() {
    const [temperature, setTemperature] = useState(1.0)
    const [topK, setTopK] = useState(40)
    const [topP, setTopP] = useState(0.95)
    const [repetitionPenalty, setRepetitionPenalty] = useState(1.05)

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 font-semibold text-white">
                <SlidersHorizontal className="w-4 h-4 text-white/70" />
                Sampling 설정
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Temperature</span>
                        <span className="text-white/40 text-[10px]">출력 다양성 (0.0–2.0)</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={2}
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="bg-white/10 text-white rounded px-2 py-1 w-[80px]"
                    />
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Top-k</span>
                        <span className="text-white/40 text-[10px]">상위 K 토큰 중 샘플 (0–1000)</span>
                    </div>
                    <input
                        type="number"
                        min={0}
                        max={1000}
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        className="bg-white/10 text-white rounded px-2 py-1 w-[80px]"
                    />
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Top-p</span>
                        <span className="text-white/40 text-[10px]">누적 확률 기반 (0.0–1.0)</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={topP}
                        onChange={(e) => setTopP(Number(e.target.value))}
                        className="bg-white/10 text-white rounded px-2 py-1 w-[80px]"
                    />
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Repetition Penalty</span>
                        <span className="text-white/40 text-[10px]">반복 방지 계수 (1.0–2.0)</span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        min={1}
                        max={2}
                        value={repetitionPenalty}
                        onChange={(e) => setRepetitionPenalty(Number(e.target.value))}
                        className="bg-white/10 text-white rounded px-2 py-1 w-[80px]"
                    />
                </div>
            </div>
        </div>
    )
}
