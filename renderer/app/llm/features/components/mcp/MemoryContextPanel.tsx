// app/llm/features/components/mcp/MemoryContextPanel.tsx
'use client'

import { useState } from 'react'
import { SlidersHorizontal, Trash2, Plus, NotepadText, BookMinus } from 'lucide-react'

const strategies = ['None', 'Window', 'Summary', 'Hybrid']

export default function MemoryContextPanel() {
    const [strategy, setStrategy] = useState('Hybrid')
    const [maxTokens, setMaxTokens] = useState(2048)
    const [includeHistory, setIncludeHistory] = useState(true)
    const [saveMemory, setSaveMemory] = useState(true)
    const [showPromptModal, setShowPromptModal] = useState(false)
    const [newPrompt, setNewPrompt] = useState('')

    const dummyPrompts = [
        'You are a helpful assistant that always answers kindly.',
        'User is roleplaying a medieval knight in a fantasy world.'
    ]

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 font-semibold text-white">
                <SlidersHorizontal className="w-4 h-4 text-white/70" />
                Memory / Context 설정
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Memory Strategy</span>
                        <span className="text-white/40 text-[10px]">컨텍스트 전략 방식</span>
                    </div>
                    <select
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value)}
                        className="text-sm bg-white/10 text-white rounded px-2 py-1"
                    >
                        {strategies.map((s) => (
                        <option key={s} value={s} className="text-black">{s}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Max Tokens</span>
                        <span className="text-white/40 text-[10px]">기억할 최대 토큰 수</span>
                    </div>
                    <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number(e.target.value))}
                        className="text-sm bg-white/10 text-white rounded px-2 py-1 w-[100px]"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Include History</span>
                    <input
                        type="checkbox"
                        checked={includeHistory}
                        onChange={() => setIncludeHistory(!includeHistory)}
                        className="w-4 h-4 accent-indigo-500"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Save Memory</span>
                    <input
                        type="checkbox"
                        checked={saveMemory}
                        onChange={() => setSaveMemory(!saveMemory)}
                        className="w-4 h-4 accent-indigo-500"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-white">
                    <NotepadText className="w-4 h-4 text-white/70" />
                    컨텍스트 프롬프트
                </div>

                {dummyPrompts.map((p, i) => (
                    <div key={i} className="flex justify-between items-start ml-0.5">
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-medium truncate max-w-[240px]">{p}</span>
                            <span className="text-white/40 text-[10px]">ContextPrompt #{i + 1}</span>
                        </div>
                        <button className="text-white/30 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setShowPromptModal(true)}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-400 mt-1"
                >
                    <Plus className="w-4 h-4" />
                    프롬프트 추가
                </button>
            </div>

            <div className="pt-1">
                <button className="flex items-center gap-1.5 text-xs text-red-400 hover:underline">
                    <BookMinus className="w-4 h-4" />
                    메모리 초기화
                </button>
            </div>

            {showPromptModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-[320px]">
                        <div className="text-white font-semibold text-sm">새 프롬프트 추가</div>
                        <textarea
                            rows={4}
                            className="w-full p-2 rounded bg-white/10 text-white text-sm placeholder-white/30"
                            placeholder="예: You are a helpful assistant..."
                            value={newPrompt}
                            onChange={(e) => setNewPrompt(e.target.value)}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setShowPromptModal(false)
                                    setNewPrompt('')
                                }}
                                className="text-xs text-white/50"
                            >
                                취소
                            </button>
                            <button
                                disabled={newPrompt.trim().length === 0}
                                onClick={() => {
                                    console.log('등록된 프롬프트:', newPrompt)
                                    setShowPromptModal(false)
                                    setNewPrompt('')
                                }}
                                className="text-xs text-indigo-300 disabled:opacity-30"
                            >
                                등록
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>      
    )
}