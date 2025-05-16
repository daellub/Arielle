// app/llm/features/components/mcp/MemoryContextPanel.tsx
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
    Save
} from 'lucide-react'

import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'

export default function SamplingPanel() {
    const activeModelId = useMCPStore(s => s.activeModelId)
    const config = useMCPStore(s => s.getCurrentConfig())
    const updateConfig = useMCPStore(s => s.updateConfig)
    const notify = useNotificationStore(s => s.show)

    const sampling = config?.sampling ?? {
        temperature: 1.0,
        topK: 40,
        topP: 0.9,
        repetitionPenalty: 1.1
    }
    
    const updateSampling = (update: Partial<typeof sampling>) => {
        if (!activeModelId) return
        updateConfig(activeModelId, {
            sampling: { ...sampling, ...update }
        })
    }

    const saveSamplingToServer = async () => {
        if (!activeModelId) return notify('모델이 선택되지 않았습니다.', 'error')
        try {
            const paramRes = await axios.get(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`)
            const currentParams = paramRes.data || {}
            await axios.patch(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`, {
                ...currentParams,
                sampling
            })
            notify('Sampling 설정이 저장되었습니다.', 'success')
        } catch (err) {
            console.error('Sampling 설정 저장 실패:', err)
            notify('Sampling 설정 저장 중 오류 발생', 'error')
        }
    }

    const resetDefaults = () => {
        updateSampling({
            temperature: 1.0,
            topK: 40,
            topP: 0.9,
            repetitionPenalty: 1.1
        })
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
                        key: 'temperature',
                        value: sampling.temperature,
                        min: 0,
                        max: 2,
                        step: 0.01,
                    },
                    {
                        icon: <List className="w-5 h-5 text-white/40" />, 
                        label: 'Top-k',
                        desc: '상위 K 토큰 중 샘플 (0–1000)',
                        key: 'topK',
                        value: sampling.topK,
                        min: 0,
                        max: 1000,
                        step: 1,
                    },
                    {
                        icon: <Percent className="w-5 h-5 text-white/40" />, 
                        label: 'Top-p',
                        desc: '누적 확률 기반 (0.0–1.0)',
                        key: 'topP',
                        value: sampling.topP,
                        min: 0,
                        max: 1,
                        step: 0.01,
                    },
                    {
                        icon: <Repeat className="w-5 h-5 text-white/40" />, 
                        label: 'Repetition Penalty',
                        desc: '반복 방지 계수 (1.0–2.0)',
                        key: 'repetitionPenalty',
                        value: sampling.repetitionPenalty,
                        min: 1,
                        max: 2,
                        step: 0.01,
                    }
                ].map(({ icon, label, desc, key, value, min, max, step }) => (
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
                            onChange={e => 
                                updateSampling({
                                    [key]: Number(e.target.value)
                                } as any)
                            }
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
                <button
                    onClick={saveSamplingToServer}
                    className="flex items-center gap-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded"
                >
                    <Save className="w-4 h-4" />
                    설정 저장
                </button>
            </div>
        </div>
    )
}   