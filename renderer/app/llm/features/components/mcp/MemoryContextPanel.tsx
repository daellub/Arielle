// app/llm/features/components/mcp/MemoryContextPanel.tsx
'use client'

import axios from 'axios'
import React, { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    SlidersHorizontal,
    NotepadText,
    Plus,
    Save,
    X,
    Trash2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'

import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { toast } from '@/app/common/toast/useToastStore'
import StepperNumber from '@/app/components/ui/StepperNumber'

const TOKEN_RANGE = { min: 256, max: 32768, step: 64 }

const strategies = ['None', 'Window', 'Summary', 'Hybrid'] as const
type Strategy = typeof strategies[number]

const BASE_MEMORY = {
    strategy: 'Hybrid' as Strategy,
    maxTokens: 2048,
    includeHistory: true,
    saveMemory: true,
    contextPrompts: [] as Array<{ id: number; content: string; enabled: boolean }>,
}

const strategyDescriptions: Record<Strategy, string> = {
    None: '메모리 저장 기능을 사용하지 않습니다.',
    Window: '최대 16개의 대화 내용만 기억하여 사용합니다.',
    Summary: '대화 내용을 요약하여 기억합니다.',
    Hybrid: '대화 내용을 요약하고, 16개의 대화 내용도 기억합니다.'
}

export default function MemoryContextPanel() {
    const activeModelId = useMCPStore(s => s.activeModelId)
    const config = useMCPStore(s => s.getCurrentConfig())
    const updateConfig = useMCPStore(s => s.updateConfig)
    const disabled = !activeModelId

    const memory = useMemo(
        () => ({
            strategy: 'Hybrid' as Strategy,
            maxTokens: 2048,
            includeHistory: true,
            saveMemory: true,
            contextPrompts: [] as Array<{ id: number; content: string; enabled: boolean }>,
            ...(config?.memory ?? {}),
        }),
        [config?.memory]
    )

    const { strategy: memoryStrategy, maxTokens, includeHistory, saveMemory, contextPrompts: prompts } = memory

    const updateMemory = useCallback(
        (update: Partial<typeof memory>) => {
            if (!activeModelId) return
            updateConfig(activeModelId, { memory: { ...memory, ...update } })
        },
        [activeModelId, updateConfig, memory]
    )

    const saveMemoryToServer = useCallback(async () => {
        if (!activeModelId) {
            toast.error({ description: '모델이 선택되지 않았습니다.', compact: true})
            return
        }
        const p = (async () => {
            const paramRes = await axios.get(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`)
            const currentParams = paramRes.data || {}
            await axios.patch(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`, {
                ...currentParams,
                memory,
            })
        })()
        try {
            await toast.promise(p, {
                loading: { description: 'Memory 설정 저장 중…', compact: true },
                success: { description: 'Memory 설정이 저장되었습니다.', compact: true },
                error:   { description: 'Memory 설정 저장 중 오류 발생', compact: true },
            })
        } catch {}
    }, [activeModelId, memory])

    const [showAddModal, setShowAddModal] = useState(false)
    const [newPrompt, setNewPrompt] = useState('')

    const addPrompt = () => {
        const content = newPrompt.trim()
        if (!content) return
        const nextId = prompts.length ? Math.max(...prompts.map(p => p.id)) + 1 : 1
        const updated = [...prompts, { id: nextId, content, enabled: true }]
        updateMemory({ contextPrompts: updated })
        setNewPrompt('')
        setShowAddModal(false)
        toast.success({ description: '프롬프트가 추가되었습니다.', compact: true })
    }

    const togglePrompt = (id: number) => {
        const updated = memory.contextPrompts.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        )
        updateMemory({ contextPrompts: updated })
    }

    const removePrompt = (id: number) => {
        const updated = prompts.filter(p => p.id !== id)
        updateMemory({ contextPrompts: updated })
        toast.info({ description: '프롬프트를 삭제했습니다.', compact: true })
    }

    const handleStrategyChange = (strategy: Strategy) => {
        updateMemory({ strategy })
    }

    const handleMaxTokensChange = (value: number) => {
        updateMemory({ maxTokens: value })
    }

    const toggleIncludeHistory = useCallback(() => {
        if (!activeModelId) return
        const s = useMCPStore.getState()
        const prev = { ...BASE_MEMORY, ... (s.getCurrentConfig()?.memory ?? {}) }
        updateConfig(activeModelId, {
            memory: { ...prev, includeHistory: !prev.includeHistory }
        })
    }, [activeModelId, updateConfig])

    const toggleSaveMemory = useCallback(() => {
        if (!activeModelId) return
        const s = useMCPStore.getState()
        const prev = { ...BASE_MEMORY, ...(s.getCurrentConfig()?.memory ?? {}) }
        updateConfig(activeModelId, {
            memory: { ...prev, saveMemory: !prev.saveMemory }
        })
    }, [activeModelId, updateConfig])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-white/70" />
                <span>Memory / Context 설정</span>
            </div>

            <div className="space-y-3">
                <div className="p-2 bg-white/5 rounded">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-white">Memory Strategy</span>
                        <select
                            className="bg-white/10 text-white text-sm rounded px-2 py-1"
                            value={memoryStrategy}
                            onChange={e => handleStrategyChange(e.target.value as Strategy)}
                        >
                            {strategies.map(s => (
                                <option key={s} value={s} className="text-black">{s}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-[10px] text-white/40">
                        {strategyDescriptions[memoryStrategy]}
                    </p>
                </div>

                <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-white">Max Tokens</span>
                    <StepperNumber 
                        value={maxTokens}
                        onChange={handleMaxTokensChange}
                        min={TOKEN_RANGE.min}
                        max={TOKEN_RANGE.max}
                        step={TOKEN_RANGE.step}
                        precision={0}
                        disabled={disabled}
                        ariaLabel='Max Tokens'
                        className='w-[120px]'
                    />
                </div>
                <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-white">Include History</span>
                    <button
                        className="text-white/40 hover:text-white"
                        onClick={toggleIncludeHistory}
                        aria-pressed={includeHistory}
                        aria-label='Include History'
                    >
                        {includeHistory
                            ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                            : <ToggleLeft className="w-5 h-5 text-white/40" />
                        }
                    </button>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-white">Save Memory</span>
                    <button
                        className="text-white/40 hover:text-white"
                        onClick={toggleSaveMemory}
                        aria-pressed={saveMemory}
                        aria-label='Save Memory'
                    >
                        {saveMemory
                            ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                            : <ToggleLeft className="w-5 h-5 text-white/40" />
                        }
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                    <NotepadText className="w-4 h-4 text-white/70" />
                    <span>컨텍스트 프롬프트</span>
                </div>
                {prompts.map(p => (
                    <div
                        key={p.id}
                        className="flex justify-between items-start p-2 bg-white/5 rounded break-all"
                    >
                        <div className="flex-1 text-xs text-white">{p.content}</div>
                        <div className="flex items-center gap-2">
                            <button
                                className="text-white/40 hover:text-white"
                                onClick={() => togglePrompt(p.id)}
                            >
                                {p.enabled
                                    ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                                    : <ToggleLeft className="w-5 h-5 text-white/40" />
                                }
                            </button>
                            <button
                                className="text-white/30 hover:text-red-400"
                                onClick={() => removePrompt(p.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-400"
                >
                    <Plus className="w-4 h-4" />
                    프롬프트 추가
                </button>
            </div>

            <button
                onClick={saveMemoryToServer}
                className="text-xs mt-4 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
            >
                설정 저장
            </button>

            {showAddModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-full max-w-sm max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Save className="w-5 h-5 text-white/60" />
                                새 프롬프트 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            className="w-full p-2 rounded bg-white/10 text-white text-sm placeholder-white/30"
                            placeholder="예: You are a helpful assistant..."
                            value={newPrompt}
                            onChange={e => setNewPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addPrompt()
                                if (e.key === 'Escape') setShowAddModal(false)
                            }}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-xs text-white/50"
                            >
                                취소
                            </button>
                            <button
                                disabled={!newPrompt.trim()}
                                onClick={addPrompt}
                                className="text-xs text-indigo-300 disabled:opacity-30 flex items-center gap-1"
                            >
                                <Save className="w-4 h-4" /> 등록
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}