'use client'

import axios from 'axios'
import { use, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    FileText,
    Copy,
    Trash2,
    Plus,
    Save,
    X,
    Pencil,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'

import { useNotificationStore } from '@/app/store/useNotificationStore'

interface PromptEntry {
    id?: number
    name: string
    preview: string
    full: string
    variables: string[]
    enabled: boolean
}

export default function PromptsPanel() {
    const [prompts, setPrompts] = useState<PromptEntry[]>([])
    const [selectedPrompt, setSelectedPrompt] = useState<PromptEntry | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editPrompt, setEditPrompt] = useState<PromptEntry | null>(null)
    const [form, setForm] = useState<PromptEntry>({
        name: '',
        preview: '',
        full: '',
        variables: [],
        enabled: true
    })

    const notify = useNotificationStore((s) => s.show)

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const response = await axios.get('http://localhost:8500/mcp/api/prompts')
                setPrompts(response.data)
            } catch (err) {
                console.error('프롬프트를 가져오는 중 오류 발생:', err)
            }
        }
        fetchPrompts()
    }, [])

    const generatePreview = (fullText: string) => {
        return fullText.slice(0, 100)
    }

    const handleFormChange = (key: keyof PromptEntry, value: any) => {
        if (key === 'full') {
            setForm(prev => ({
                ...prev,
                [key]: value,
                preview: value.slice(0, 100)
            }))
        } else {
            setForm(prev => ({ ...prev, [key]: value }));
        }
    }

    const addPrompt = async () => {
        try {
            const promptData = {
                ...form,
                template: form.full,
                variables: form.variables   
            }
            const response = await axios.post('http://localhost:8500/mcp/api/prompts', promptData)
            setPrompts(prev => [...prev, response.data])
            setShowAddModal(false)
            setForm({ name: '', preview: '', full: '', variables: [], enabled: true })

            notify('프롬프트를 추가했습니다', 'success')
        } catch (err) {
            console.error('프롬프트 추가 중 오류 발생:', err)
        }
    }

    const updatePrompt = async () => {
        if (!editPrompt) return

        const hasChanges = 
            editPrompt.name !== selectedPrompt?.name ||
            editPrompt.full !== selectedPrompt?.full ||
            JSON.stringify(editPrompt.variables) !== JSON.stringify(selectedPrompt?.variables) ||
            editPrompt.enabled !== selectedPrompt?.enabled

        if (!hasChanges) {
            console.log('수정된 내용이 없습니다.')
            return
        }

        try {
            const response = await axios.patch(`http://localhost:8500/mcp/api/prompts/${editPrompt.id}`, editPrompt)
            setPrompts(prev => prev.map(p => p.id === editPrompt.id ? response.data : p))
            setShowEditModal(false)
            setEditPrompt(null)

            notify('프롬프트를 수정했습니다.', 'success')
        } catch (err) {
            console.error('프롬프트 수정 중 오류 발생:', err)
        }
    }

    const deletePrompt = async (promptId: number) => {
        try {
            await axios.delete(`http://localhost:8500/mcp/api/prompts/${promptId}`)
            setPrompts(prev => prev.filter(p => p.id !== promptId))

            notify('프롬프트를 삭제했습니다.', 'success')
        } catch (err) {
            console.error('프롬프트 삭제 중 오류 발생:', err)
        }
    }

    const handleEditPrompt = (prompt: PromptEntry) => {
        setEditPrompt(prompt)
        setShowEditModal(true)
    }

    const handleEditFormChange = (key: keyof PromptEntry, value: any) => {
        if (editPrompt) {
            setEditPrompt(prev => ({ ...prev!, [key]: value }));
        }
    }

    const copyPrompt = async (prompt: PromptEntry) => {
        try {
            const copiedPrompt = {
                ...prompt,
                id: undefined, // 새로운 ID로 설정
                name: `${prompt.name} (복사)`,
            }
            const response = await axios.post('http://localhost:8500/mcp/api/prompts', copiedPrompt)

            setPrompts(prev => [...prev, response.data])

            notify('프롬프트를 복사했습니다.', 'success')
        } catch (err) {
            notify('프롬프트 복사를 실패했습니다.', 'error')
            console.error('프롬프트 복사 중 오류 발생:', err)
        }
    }

    return (
        <div className="space-y-2">
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

            {prompts.map((p, i) => (
                <div
                    key={i}
                    className={`p-2 rounded-lg hover:bg-white/10 transition cursor-pointer 
                                ${p.enabled ? 'border-[0.1px] border-green-300' : ''} 
                                shadow-md`}
                    onClick={() => setSelectedPrompt(p)}
                >
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-white/40" />
                            <span className="text-white font-medium">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                className='text-white/40 hover:text-white/70'
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditPrompt(p)
                                }}
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    copyPrompt(p)
                                }}
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button 
                                className="text-white/30 hover:text-red-400"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    deletePrompt(p.id!)
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="text-white/40 text-[10px] mb-1 break-all">
                        {generatePreview(p.full)}...
                    </div>

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
                            value={form.name || ''}
                            onChange={e => handleFormChange('name', e.target.value)}
                        />
                        <textarea
                            className="w-full p-2 rounded bg-white/10 text-white text-sm h-32"
                            placeholder="전체 템플릿 내용"
                            value={form.full || ''}
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

            {selectedPrompt && createPortal(
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPrompt(null)}
                >
                    <div
                        className="scrollLLMArea bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-auto relative"
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

            {showEditModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowEditModal(false)} // 모달 외부 클릭 시 닫기
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}  // 모달 안에서 클릭해도 모달이 닫히지 않게
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Save className="w-5 h-5 text-white/60" />
                                프롬프트 수정
                            </h4>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="이름"
                            value={editPrompt?.name}
                            onChange={e => handleEditFormChange('name', e.target.value)} // 수정할 이름 입력
                        />
                        <textarea
                            className="w-full p-2 rounded bg-white/10 text-white text-sm h-32"
                            placeholder="전체 템플릿 내용"
                            value={editPrompt?.full}
                            onChange={e => handleEditFormChange('full', e.target.value)} // 수정할 템플릿 내용 입력
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="변수 (콤마로 구분)"
                            value={editPrompt?.variables.join(',')}
                            onChange={e => handleEditFormChange('variables', e.target.value.split(','))} // 변수 수정
                        />
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editPrompt?.enabled}
                                onChange={e => handleEditFormChange('enabled', e.target.checked)} // 수정된 enabled 상태
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-white text-sm">Enabled</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-xs text-white/50"
                            >
                                취소
                            </button>
                            <button
                                onClick={updatePrompt}
                                className="text-xs text-indigo-300 flex items-center gap-1"
                            >
                                <Save className="w-4 h-4" /> 수정 완료
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}