'use client'

import axios from 'axios'
import { useEffect, useState, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import {
    SlidersHorizontal,
    NotepadText,
    Plus,
    Save,
    X,
    Trash2,
    RefreshCw,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import clsx from 'clsx'

import useMemoryStore, { MemoryPrompt } from '@/app/llm/features/store/useMemoryStore'

const strategies = ['None', 'Window', 'Summary', 'Hybrid'] as const

type Strategy = typeof strategies[number]

export default function MemoryContextPanel() {
    const memoryStrategy = useMemoryStore(state => state.memoryStrategy)
    const maxTokens = useMemoryStore(state => state.maxTokens)
    const includeHistory = useMemoryStore(state => state.includeHistory)
    const saveMemory = useMemoryStore(state => state.saveMemory)
    const prompts = useMemoryStore(state => state.contextPrompts)
    const updateMemorySettings = useMemoryStore(state => state.updateMemorySettings)

    const [showAddModal, setShowAddModal] = useState(false)
    const [newPrompt, setNewPrompt] = useState('')
    const saveTimer = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        axios.get('http://localhost:8500/mcp/api/memory/settings')
            .then(res => {
                const { memory_strategy, max_tokens, include_history, save_memory, context_prompts } = res.data
                updateMemorySettings({
                    memoryStrategy: memory_strategy,
                    maxTokens: max_tokens,
                    includeHistory: include_history,
                    saveMemory: save_memory,
                    contextPrompts: context_prompts
                })
            })
            .catch(err => {
                if (err.response?.status === 404) {
                    axios.post('http://localhost:8500/mcp/api/memory/settings', {
                        memory_strategy: memoryStrategy,
                        max_tokens: maxTokens,
                        include_history: includeHistory,
                        save_memory: saveMemory,
                        context_prompts: prompts
                    })
                    .then(() => {
                        console.log('기본 메모리 설정 DB에 저장됨')
                    })
                    .catch(console.error)
                } else {
                    console.error('Failed to fetch memory settings:', err)
                }
            })
    }, [])

    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            axios.patch('http://localhost:8500/mcp/api/memory/settings', {
                memory_strategy: memoryStrategy,
                max_tokens: maxTokens,
                include_history: includeHistory,
                save_memory: saveMemory,
                context_prompts: prompts
            }).catch(error => console.error('Failed to save memory settings:', error))
        }, 1000)
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [memoryStrategy, maxTokens, includeHistory, saveMemory, prompts])

    const handleStrategyChange = (s: Strategy) => updateMemorySettings({ memoryStrategy: s })
    const handleMaxTokensChange = (n: number) => updateMemorySettings({ maxTokens: n })
    const toggleIncludeHistory = () => updateMemorySettings({ includeHistory: !includeHistory })
    const toggleSaveMemory = () => updateMemorySettings({ saveMemory: !saveMemory })
    const togglePrompt = (id: number) => {
        const updated = prompts.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
        updateMemorySettings({ contextPrompts: updated })
    }
    const removePrompt = (id: number) => {
        const updated = prompts.filter(p => p.id !== id)
        updateMemorySettings({ contextPrompts: updated })
    }
    const addPrompt = () => {
        const nextId = prompts.length ? Math.max(...prompts.map(p => p.id)) + 1 : 1
        const updated = [...prompts, { id: nextId, content: newPrompt.trim(), enabled: true }]
        updateMemorySettings({ contextPrompts: updated })
        setNewPrompt('')
        setShowAddModal(false)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-white font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-white/70" />
                <span>Memory / Context 설정</span>
            </div>

            {/* Settings */}
            <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white/5 rounded">
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
                <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-white">Max Tokens</span>
                    <input
                        type="number"
                        className="bg-white/10 text-white text-sm rounded px-2 py-1 w-[100px]"
                        value={maxTokens}
                        onChange={e => handleMaxTokensChange(Number(e.target.value))}
                    />
                </div>
                <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-white">Include History</span>
                    <button
                        className="text-white/40 hover:text-white"
                        onClick={toggleIncludeHistory}
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
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-xs text-white/50"
                            >취소</button>
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