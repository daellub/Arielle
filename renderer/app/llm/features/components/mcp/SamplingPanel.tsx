'use client'

import { useState } from 'react'
import {
    SlidersHorizontal,
    Thermometer,
    List,
    Percent,
    Repeat,
    RefreshCw,
    Plus,
    Save
} from 'lucide-react'
import clsx from 'clsx'

export default function SamplingPanel() {
    const [temperature, setTemperature] = useState(1.0)
    const [topK, setTopK] = useState(40)
    const [topP, setTopP] = useState(0.95)
    const [repetitionPenalty, setRepetitionPenalty] = useState(1.05)

    const resetDefaults = () => {
        setTemperature(1.0)
        setTopK(40)
        setTopP(0.95)
        setRepetitionPenalty(1.05)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
                <SlidersHorizontal className="w-5 h-5 text-white/70" />
                <span>Sampling 설정</span>
            </div>

            <div className="space-y-2">
                {[
                    {
                        icon: <Thermometer className="w-5 h-5 text-white/40" />, 
                        label: 'Temperature',
                        desc: '출력 다양성 (0.0–2.0)',
                        value: temperature,
                        min: 0,
                        max: 2,
                        step: 0.01,
                        onChange: setTemperature
                    },
                    {
                        icon: <List className="w-5 h-5 text-white/40" />, 
                        label: 'Top-k',
                        desc: '상위 K 토큰 중 샘플 (0–1000)',
                        value: topK,
                        min: 0,
                        max: 1000,
                        step: 1,
                        onChange: setTopK
                    },
                    {
                        icon: <Percent className="w-5 h-5 text-white/40" />, 
                        label: 'Top-p',
                        desc: '누적 확률 기반 (0.0–1.0)',
                        value: topP,
                        min: 0,
                        max: 1,
                        step: 0.01,
                        onChange: setTopP
                    },
                    {
                        icon: <Repeat className="w-5 h-5 text-white/40" />, 
                        label: 'Repetition Penalty',
                        desc: '반복 방지 계수 (1.0–2.0)',
                        value: repetitionPenalty,
                        min: 1,
                        max: 2,
                        step: 0.01,
                        onChange: setRepetitionPenalty
                    }
                ].map(({ icon, label, desc, value, min, max, step, onChange }) => (
                    <div key={label} className="flex justify-between items-center p-2 bg-white/5 rounded">
                        <div className="flex items-center gap-2">
                            {icon}
                            <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">{label}</span>
                                <span className="text-white/40 text-[10px]">{desc}</span>
                            </div>
                        </div>
                        <input
                            type="number"
                            className="w-20 bg-white/10 text-white text-sm rounded px-2 py-1"
                            value={value}
                            min={min}
                            max={max}
                            step={step}
                            onChange={e => onChange(Number(e.target.value))}
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-end items-center gap-2 pt-2">
                <button
                    onClick={resetDefaults}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-400"
                >
                    <RefreshCw className="w-4 h-4" />
                    기본값 복원
                </button>
            </div>
        </div>
    )
}   