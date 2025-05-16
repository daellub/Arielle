'use client'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Wrench,
    Trash2,
    Play,
    Save,
    Plus,
    ToggleLeft,
    ToggleRight,
    CheckCircle,
    XCircle,
    Link2,
    Pencil
} from 'lucide-react'
import clsx from 'clsx'

import {
    fetchTools,
    createTool,
    updateTool,
    deleteTool,
} from '@/app/llm/services/toolsAPI'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'

interface Tool {
    id?: number
    name: string
    type: string
    command: string
    status: 'active' | 'inactive'
    enabled: boolean
}

export default function ToolsPanel() {
    const [tools, setTools] = useState<Tool[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [form, setForm] = useState<Tool>({
        name: '',
        type: '',
        command: '',
        status: 'active',
        enabled: true
    })
    const activeModelId = useMCPStore(s => s.activeModelId)
    const configMap = useMCPStore(s => s.configMap)
    const updateConfig = useMCPStore(s => s.updateConfig)
    const linkedToolIds = activeModelId ? configMap[activeModelId]?.linkedToolIds ?? [] : []

    const notify = useNotificationStore((s) => s.show)

    useEffect(() => {
        fetchTools().then(data => setTools(data))
    }, [])

    useEffect(() => {
        if (!activeModelId) return
        axios.get(`http://localhost:8500/mcp/llm/model/${activeModelId}/tools`)
            .then(res => {
                const ids = res.data.map((t: any) => t.tool_id)
                updateConfig(activeModelId, { linkedToolIds: ids })
            })
            .catch(err => {
                console.error('연동된 도구 불러오기 실패:', err)
                notify('연동된 도구 목록을 불러오는 중 오류 발생', 'error')
            })
    }, [activeModelId])

    const handleFormChange = (key: keyof Tool, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const addTool = async () => {
        const newTool = await createTool(form)
        setTools(prev => [...prev, newTool])
        setForm({ name: '', type: '', command: '', status: 'active', enabled: true })
        setShowAddModal(false)

        notify('도구를 추가했습니다.', 'success')
    }

    const editTool = async (id: number) => {
        const currentTool = tools.find(tool => tool.id === id)
        if (!currentTool) return

        const hasChanges =
            form.name !== currentTool.name ||
            form.type !== currentTool.type ||
            form.command !== currentTool.command ||
            form.status !== currentTool.status ||
            form.enabled !== currentTool.enabled
        
        if (!hasChanges) {
            setShowEditModal(false)
            notify('도구를 수정했습니다.', 'success')
            return;
        }

        const updatedTool = { ...form, id }
        try {
            const updatedData = await updateTool(id, updatedTool)
            setTools(prev =>
                prev.map(tool => (tool.id === id ? updatedData : tool))
            )
            setShowEditModal(false)
            setForm({ name: '', type: '', command: '', status: 'active', enabled: true })
            notify('도구를 수정했습니다.', 'success')
        } catch (err) {
            console.error('Error updating tool:', err)
            notify('도구를 수정하는 중 오류가 발생했습니다.', 'error')
        }
    }

    const removeTool = async (id: number) => {
        await deleteTool(id)
        setTools(prev => prev.filter(tool => tool.id !== id))

        notify('도구를 삭제했습니다.', 'success')
    }

    const toggleTool = async (tool: Tool) => {
        try {
            const updatedTool = {
                ...tool,
                enabled: !tool.enabled
            }
            await updateTool(tool.id!, updatedTool)
            setTools(prev =>
                prev.map(t => (t.id === tool.id ? { ...t, enabled: !t.enabled } : t))
            )

            notify(`도구를 ${tool.enabled ? '비활성화' : '활성화'}했습니다.`, 'success')
        } catch (err) {
            console.error('Error toggling tool:', err)
            notify('도구를 활성화/비활성화하는 중 오류가 발생했습니다.', 'error')
        }
    }

    const handleEditTool = (tool: Tool) => {
        setForm({
            id: tool.id,
            name: tool.name,
            type: tool.type,
            command: tool.command,
            status: tool.status,
            enabled: tool.enabled
        })
        setShowAddModal(false)
        setShowEditModal(true)
    }

    const handleToggleToolLink = async (toolId: number) => {
        if (!activeModelId) return notify('모델을 먼저 선택해주세요.', 'error')

        const updated = linkedToolIds.includes(toolId)
            ? linkedToolIds.filter(id => id !== toolId)
            : [...linkedToolIds, toolId]

        updateConfig(activeModelId, { linkedToolIds: updated })

        try {
            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/tools`,
                { tool_ids: updated }
            )

            const paramRes = await axios.get(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/params`
            )
            const currentParams = paramRes.data || {}

            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/params`,
                { ...currentParams, tools: updated }
            )

            notify('도구 연동 상태가 업데이트되었습니다.', 'success')
        } catch (err) {
            console.error('도구 연동 업데이트 실패:', err)
            notify('도구 연동 상태 저장 실패', 'error')
        }
    }

    const executeTool = async (tool: Tool) => {
        if (!tool.enabled) {
            notify('도구가 비활성화되어 있습니다.', 'error')
            return
        } else {
            try {
                if (tool.type === 'python') {
                    if (!tool.command) {
                        notify('Python 도구의 커맨드가 비어있습니다.', 'error')
                        return
                    }

                    const encodedCommand = encodeURIComponent(tool.command)

                    const response = await axios.get('http://localhost:8500/mcp/api/tools/python', {
                        params: { command: encodedCommand }
                    })
                    console.log('Python tool response:', response.data)
                } else if (tool.type === 'rest') {
                    const response = await axios.get(tool.command)
                    console.log('REST tool response:', response.data)
                } else if (tool.type === 'powershell') {
                    const response = await axios.get('http://localhost:8500/mcp/api/tools/powershell', {
                        params: { command: tool.command }
                    })
                    console.log('Bash tool response:', response.data)
                }
                notify(`도구 ${tool.name}을(를) 실행했습니다.`, 'success')
            } catch (err) {
                console.error('Error executing tool:', err)
                notify(`도구 ${tool.name}을(를) 실행하는 중 오류가 발생했습니다.`, 'error')
            }
        }
    }

    const getPlaceholder = (type: string) => {
        switch (type) {
            case 'python':
                return 'Python 커맨드 입력';
            case 'rest':
                return 'REST API URL 입력';
            case 'powershell':
                return 'PowerShell 명령어 입력';
            default:
                return '커맨드를 입력하세요';
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-white/60" />
                    툴 목록
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    툴 추가
                </button>
            </div>

            {tools.map((tool, i) => (
                <div
                    key={i}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition"
                >
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-white/40" />
                            <span className="text-white font-medium">{tool.name}</span>
                            <span className="text-white/40 text-[10px]">({tool.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToggleToolLink(tool.id!)}
                                className={clsx(
                                    'px-2 py-0.5 rounded-full text-[10px] border transition',
                                    linkedToolIds.includes(tool.id!)
                                        ? 'bg-indigo-500 text-white border-indigo-400'
                                        : 'bg-white/10 text-white/40 border-white/20 hover:bg-white/20'
                                )}
                            >
                                {linkedToolIds.includes(tool.id!) ? '연결됨' : '미연결'}
                            </button>
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={() => executeTool(tool)}
                            >
                                <Play className="w-4 h-4" />
                            </button>
                            <button
                                className='text-white/40 hover:text-white/70'
                                onClick={() => handleEditTool(tool)}
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={() => toggleTool(tool)} 
                            >
                                {tool.enabled
                                    ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                                    : <ToggleLeft className="w-5 h-5 text-white/40" />
                                }
                            </button>
                            <button
                                className="text-white/30 hover:text-red-400"
                                onClick={() => tool.id !== undefined && removeTool(tool.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1 break-all">
                        <Link2 className="w-4 h-4" />
                        <span>{tool.command}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {tool.enabled
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        }
                        <span className={clsx('text-[10px] font-medium', {
                            'text-green-400': tool.enabled,
                            'text-red-400': !tool.enabled
                        })}>
                            {tool.enabled ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            ))}

            {showAddModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-[90%] max-w-sm max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-3">
                                <Save className="w-5 h-5 text-white/60" />
                                새 툴 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white"
                            >✕</button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="툴 이름"
                            value={form.name}
                            onChange={e => handleFormChange('name', e.target.value)}
                        />
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={form.type}
                            onChange={e => handleFormChange('type', e.target.value)}
                        >
                            <option className="text-black" value="python">Python</option>
                            <option className="text-black" value="rest">REST</option>
                            <option className="text-black" value="powershell">PowerShell</option> {/* 필요에 따라 다른 옵션 추가 */}
                        </select>
                        <textarea
                            rows={3}
                            className="w-full p-2 rounded bg-white/10 text-white text-sm resize-none"
                            placeholder={getPlaceholder(form.type)}
                            value={form.command}
                            onChange={e => handleFormChange('command', e.target.value)}
                        />
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={form.status}
                            onChange={e => handleFormChange('status', e.target.value as 'active' | 'inactive')}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

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
                            >취소</button>
                            <button
                                onClick={addTool}
                                className="text-xs text-indigo-300 flex items-center gap-1"
                            >
                                <Save className="w-4 h-4" /> 등록
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showEditModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-[90%] max-w-sm max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-3">
                                <Save className="w-5 h-5 text-white/60" />
                                툴 수정
                            </h4>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-white/50 hover:text-white"
                            >✕</button>
                        </div>

                        <input className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="툴 이름"
                            value={form.name}
                            onChange={e => handleFormChange('name', e.target.value)}
                        />
                        <input className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="타입 (예: python, rest)"
                            value={form.type}
                            onChange={e => handleFormChange('type', e.target.value)}
                        />
                        <input className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="커맨드"
                            value={form.command}
                            onChange={e => handleFormChange('command', e.target.value)}
                        />
                        <select className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={form.status}
                            onChange={e => handleFormChange('status', e.target.value as 'active' | 'inactive')}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={form.enabled}
                                onChange={e => handleFormChange('enabled', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-white text-sm">Enabled</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowEditModal(false)} className="text-xs text-white/50">취소</button>
                            <button onClick={() => editTool(form.id!)} className="text-xs text-indigo-300 flex items-center gap-1">
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