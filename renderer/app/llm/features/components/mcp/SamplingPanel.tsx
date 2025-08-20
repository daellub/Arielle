// app/llm/features/components/mcp/MemoryContextPanel.tsx
'use client'

import axios from 'axios'
import React, { useCallback, useMemo, useState } from 'react'
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
import { toast } from '@/app/common/toast/useToastStore'
import StepperNumber from '@/app/components/ui/StepperNumber'

type Sampling = {
    temperature: number
    topK: number
    topP: number
    repetitionPenalty: number
}

const DEFAULTS: Sampling = {
    temperature: 1.0,
    topK: 40,
    topP: 0.9,
    repetitionPenalty: 1.1,
}

const RANGES: Record<keyof Sampling, { min: number; max: number; step: number }> = {
    temperature: { min: 0, max: 2, step: 0.01 },
    topK: { min: 0, max: 1000, step: 1 },
    topP: { min: 0, max: 1, step: 0.01 },
    repetitionPenalty: { min: 1, max: 2, step: 0.01 },
}

const pretty = (k: keyof Sampling) =>
    k === 'temperature' ? 'Temperature'
    : k === 'topK' ? 'Top-k'
    : k === 'topP' ? 'Top-p'
    : 'Repetition Penalty'

const desc = (k: keyof Sampling) =>
    k === 'temperature' ? '출력 다양성 (0.0–2.0)'
    : k === 'topK' ? '상위 K 토큰 중 샘플 (0–1000)'
    : k === 'topP' ? '누적 확률 기반 (0.0–1.0)'
    : '반복 방지 계수 (1.0–2.0)'

const iconOf = (k: keyof Sampling) =>
    k === 'temperature' ? <Thermometer className="w-5 h-5 text-white/60" /> :
    k === 'topK' ? <List className="w-5 h-5 text-white/60" /> :
    k === 'topP' ? <Percent className="w-5 h-5 text-white/60" /> :
    <Repeat className="w-5 h-5 text-white/60" />

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export default function SamplingPanel() {
    const activeModelId = useMCPStore(s => s.activeModelId)
    const config = useMCPStore(s => s.getCurrentConfig())
    const updateConfig = useMCPStore(s => s.updateConfig)
    const disabled = !activeModelId

    const sampling = useMemo<Sampling>(
        () => ({ ...DEFAULTS, ...(config?.sampling ?? {}) }),
        [config?.sampling]
    )

    const [saving, setSaving] = useState(false)
    
    const updateSampling = useCallback(
        (update: Partial<Sampling>) => {
            if (!activeModelId) {
                toast.info({ description: '먼저 모델을 선택해주세요.', compact: true })
                return
            }
            updateConfig(activeModelId, { sampling: { ...sampling, ...update } })
        },
        [activeModelId, updateConfig, sampling]
    )

    const handleChange = useCallback(
        (key: keyof Sampling, raw: string | number, clampOnBlur = false) => {
            if (disabled) return
            const { min, max } = RANGES[key]
            const n = typeof raw === 'number' ? raw : Number(raw)
            const value = clampOnBlur ? clamp(n, min, max) : n
            if (Number.isNaN(value)) return
            updateSampling({ [key]: value } as Partial<Sampling>)
        },
        [disabled, updateSampling]
    )

    const resetDefaults = useCallback(() => {
        if (disabled) return
        updateSampling({ ...DEFAULTS })
        toast.success({ description: '기본값으로 복원했습니다.', compact: true })
    }, [disabled,updateSampling])

    const saveSamplingToServer = useCallback(async () => {
        if (disabled) {
            toast.info({ description: '먼저 모델을 선택해 주세요.', compact: true })
            return
        }
        setSaving(true)
        try {
            await toast.promise(
                (async () => {
                    const paramRes = await axios.get(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`)
                    const currentParams = paramRes.data || {}
                    await axios.patch(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`, {
                        ...currentParams,
                        sampling,
                    })
                })(),
                {
                    loading: { description: 'Sampling 설정 저장 중…', compact: true },
                    success: { description: 'Sampling 설정이 저장되었습니다.', compact: true },
                    error:   { description: 'Sampling 설정 저장 실패', compact: true },
                }
            )
        } finally {
            setSaving(false)
        }
    }, [disabled, activeModelId, sampling])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
                <SlidersHorizontal className="w-5 h-5 text-white/70" />
                <span>Sampling 설정</span>
                {disabled && (
                    <span className="ml-2 text-[10px] text-white/50">모델을 먼저 선택하세요</span>
                )}
            </div>

            <div className="space-y-2">
                {(Object.keys(RANGES) as (keyof Sampling)[]).map((key) => {
                    const r = RANGES[key]
                    const val = sampling[key]
                    const isFloat = r.step < 1
                    const display = isFloat ? Number(val).toFixed(2) : String(val)

                    return (
                        <div
                            key={key}
                            className={`rounded-xl p-3 ring-1 ring-white/10 bg-white/5 transition
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/[.07]'}`}
                            aria-disabled={disabled}
                            title={disabled ? '모델을 먼저 선택하세요' : undefined}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {iconOf(key)}
                                    <div className="leading-tight">
                                        <div className="text-white font-medium text-sm">{pretty(key)}</div>
                                        <div className="text-white/50 text-[10px]">{desc(key)}</div>
                                    </div>
                                </div>

                                <StepperNumber
                                    value={Number(val)}
                                    onChange={(nv) => updateSampling({ [key]: nv } as Partial<Sampling>)}
                                    min={r.min}
                                    max={r.max}
                                    step={r.step}
                                    precision={r.step < 1 ? 2 : 0}
                                    disabled={disabled}
                                    ariaLabel={pretty(key)}
                                    className="w-[120px]"
                                />
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="range"
                                    className="w-full accent-indigo-400 disabled:opacity-60"
                                    min={r.min}
                                    max={r.max}
                                    step={r.step}
                                    value={clamp(Number(val), r.min, r.max)}
                                    disabled={disabled}
                                    onChange={(e) => handleChange(key, Number(e.target.value), true)}
                                />
                                <span className="text-[11px] text-white/60 tabular-nums w-14 text-right">
                                    {display}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 pb-4 ">
                <button
                    onClick={resetDefaults}
                    disabled={disabled}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ring-1 transition
                            ${disabled ? 'opacity-50 cursor-not-allowed ring-white/10 text-white/60'
                                        : 'text-white/80 hover:text-white bg-white/0 hover:bg-white/10 ring-white/10 hover:ring-white/20'}`}
                    title={disabled ? '모델을 먼저 선택하세요' : undefined}
                >
                    <RefreshCw className="w-4 h-4" />
                    기본값 복원
                </button>

                <button
                    onClick={saveSamplingToServer}
                    disabled={disabled || saving}
                    className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-md font-medium transition
                            ${disabled || saving
                                ? 'opacity-60 cursor-not-allowed bg-white/10 text-white/60 ring-1 ring-white/10'
                                : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white ring-1 ring-indigo-300/40 hover:from-indigo-400 hover:to-fuchsia-400 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]'}`}
                    title={disabled ? '모델을 먼저 선택하세요' : undefined}
                >
                    <Save className="w-4 h-4" />
                    설정 저장
                </button>
            </div>
        </div>
    )
}   