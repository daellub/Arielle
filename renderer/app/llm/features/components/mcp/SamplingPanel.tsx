'use client'

import axios from 'axios'
import { useEffect, useRef } from 'react'
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

import useSamplingStore from '@/app/llm/features/store/useSamplingStore'

export default function SamplingPanel() {
    const { temperature, topK, topP, repetitionPenalty } = useSamplingStore(state => state)

    const updateSamplingSettings = useSamplingStore(state => state.updateSamplingSettings)

    const handleTemperatureChange = (value: number) => updateSamplingSettings({ temperature: value })
    const handleTopKChange = (value: number) => updateSamplingSettings({ topK: value })
    const handleTopPChange = (value: number) => updateSamplingSettings({ topP: value })
    const handleRepetitionPenaltyChange = (value: number) => updateSamplingSettings({ repetitionPenalty: value })

    const saveTimer = useRef<NodeJS.Timeout | null>(null)

    const resetDefaults = () => {
        updateSamplingSettings({ temperature: 1.0, topK: 40, topP: 0.9, repetitionPenalty: 1.1 })
    }
    
    useEffect(() => {
        axios.get('http://localhost:8500/mcp/api/sampling/settings')
            .then(res => {
                const { temperature, top_k, top_p, repetition_penalty } = res.data
                updateSamplingSettings({
                    temperature: temperature,
                    topK: top_k,
                    topP: top_p,
                    repetitionPenalty: repetition_penalty
                })
            })
            .catch(err => {
                if (err.response?.status === 404) {
                    axios.post('http://localhost:8500/mcp/api/sampling/settings', {
                        temperature: temperature,
                        top_k: topK,
                        top_p: topP,
                        repetition_penalty: repetitionPenalty,
                    })
                    .then(() => {
                        console.log('기본 설정이 저장되었습니다.')
                    })
                    .catch(console.error)
                } else {
                    console.error('Error fetching sampling settings:', err)
                }
            })
    }, [])

    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current)

        saveTimer.current = setTimeout(() => {
            axios.patch('http://localhost:8500/mcp/api/sampling/settings', {
                temperature: temperature,
                top_k: topK,
                top_p: topP,
                repetition_penalty: repetitionPenalty,
            })
            .then(() => {
                console.log('설정이 저장되었습니다.')
            })
            .catch(console.error)
        }, 1000)

        return () => {
            if (saveTimer.current) {
                clearTimeout(saveTimer.current)
            }
        }
    }, [temperature, topK, topP, repetitionPenalty])

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
                        onChange: handleTemperatureChange
                    },
                    {
                        icon: <List className="w-5 h-5 text-white/40" />, 
                        label: 'Top-k',
                        desc: '상위 K 토큰 중 샘플 (0–1000)',
                        value: topK,
                        min: 0,
                        max: 1000,
                        step: 1,
                        onChange: handleTopKChange
                    },
                    {
                        icon: <Percent className="w-5 h-5 text-white/40" />, 
                        label: 'Top-p',
                        desc: '누적 확률 기반 (0.0–1.0)',
                        value: topP,
                        min: 0,
                        max: 1,
                        step: 0.01,
                        onChange: handleTopPChange
                    },
                    {
                        icon: <Repeat className="w-5 h-5 text-white/40" />, 
                        label: 'Repetition Penalty',
                        desc: '반복 방지 계수 (1.0–2.0)',
                        value: repetitionPenalty,
                        min: 1,
                        max: 2,
                        step: 0.01,
                        onChange: handleRepetitionPenaltyChange
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