'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
    FileText,
    Copy,
    Trash2,
    Plus,
    Save,
    X,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import clsx from 'clsx'

interface PromptEntry {
    name: string
    preview: string
    full: string
    variables: string[]
    enabled: boolean
}

const dummyPrompts: PromptEntry[] = [
    {
        name: 'Friendly Assistant',
        preview: '당신은 상냥하고 배려 깊은 AI 어시스턴트입니다...',
        full: '당신은 상냥하고 배려 깊은 AI 어시스턴트입니다. 항상 친절한 말투로 응답하고, 감정을 잘 표현해주세요.\n\n사용자 입력: {user_input}\n현재 날짜: {date}',
        variables: ['{user_input}', '{date}'],
        enabled: true
    },
    {
        name: 'Character RP',
        preview: 'You are roleplaying as an ancient elf queen...',
        full: 'You are roleplaying as an ancient elf queen who speaks with poetic tone.\n\nPersona: {persona}\nContext: {context}',
        variables: ['{persona}', '{context}'],
        enabled: false
    }
]

export default function PromptsPanel() {
    const [prompts, setPrompts] = useState<PromptEntry[]>(dummyPrompts)
    const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState<PromptEntry>({
        name: '',
        preview: '',
        full: '',
        variables: [],
        enabled: true
    })

    const handleFormChange = (key: keyof PromptEntry, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const addPrompt = () => {
        setPrompts(prev => [...prev, form])
        setShowAddModal(false)
        setForm({ name: '', preview: '', full: '', variables: [], enabled: true })
    }

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-white/60" />
                    프롬프트 템플릿
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> 템플릿 추가
                </button>
            </div>

            {/* Prompt Cards */}
            {prompts.map((p, i) => (
                <div
                    key={i}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition cursor-pointer"
                    onClick={() => setSelectedPrompt(p)}
                >
                    {/* Title & Controls */}
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-white/40" />
                            <span className="text-white font-medium">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="text-white/40 hover:text-white/70">
                                <Copy className="w-4 h-4" />
                            </button>
                            <button className="text-white/30 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Preview Line */}
                    <div className="text-white/40 text-[10px] mb-1 break-all">
                        {p.preview}
                    </div>

                    {/* Variables Line */}
                    <div className="flex flex-wrap items-center gap-1 text-[9px] text-white/60">
                        <span>변수:</span>
                        {p.variables.map((v, idx) => (
                            <span
                                key={idx}
                                className="bg-indigo-600/20 text-indigo-200 px-1 rounded"
                            >
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
            ))}

            {/* Add Prompt Modal */}
            {showAddModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Save className="w-5 h-5 text-white/60" />
                                새 템플릿 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="이름"
                            value={form.name}
                            onChange={e => handleFormChange('name', e.target.value)}
                        />
                        <textarea
                            className="w-full p-2 rounded bg-white/10 text-white text-sm h-20"
                            placeholder="미리보기 텍스트"
                            value={form.preview}
                            onChange={e => handleFormChange('preview', e.target.value)}
                        />
                        <textarea
                            className="w-full p-2 rounded bg-white/10 text-white text-sm h-32"
                            placeholder="전체 템플릿 내용"
                            value={form.full}
                            onChange={e => handleFormChange('full', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="변수 (콤마로 구분)"
                            value={form.variables.join(',')}
                            onChange={e => handleFormChange('variables', e.target.value.split(','))}
                        />
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.enabled}
                                onChange={e => handleFormChange('enabled', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-white text-sm">Enabled</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-xs text-white/50"
                            >
                                취소
                            </button>
                            <button
                                onClick={addPrompt}
                                className="text-xs text-indigo-300 flex items-center gap-1"
                            >
                                <Save className="w-4 h-4" /> 등록
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Detail Modal */}
            {selectedPrompt && createPortal(
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPrompt(null)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-auto relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                            onClick={() => setSelectedPrompt(null)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-lg font-semibold text-white">{selectedPrompt.name}</div>
                        <pre className="font-omyu_pretty whitespace-pre-wrap text-white/70 text-sm">
                            {selectedPrompt.full}
                        </pre>
                        <div className="flex flex-wrap items-center gap-1 text-[9px] text-white/60">
                            <span>변수:</span>
                            {selectedPrompt.variables.map((v, i) => (
                                <span key={i} className="bg-indigo-600/20 text-indigo-200 px-1 rounded">
                                    {v}
                                </span>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setSelectedPrompt(null)}
                                className="text-xs text-white/50"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}