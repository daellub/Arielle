'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Wrench,
    Trash2,
    RefreshCw,
    Save,
    Plus,
    ToggleLeft,
    ToggleRight,
    CheckCircle,
    XCircle,
    Link2
} from 'lucide-react'
import clsx from 'clsx'

interface Tool {
    name: string
    type: string
    command: string
    status: 'active' | 'inactive'
    enabled: boolean
}

const dummyTools: Tool[] = [
    {
        name: 'Calculator',
        type: 'python',
        command: 'calculate(expression)',
        status: 'active',
        enabled: true
    },
    {
        name: 'Browser Search',
        type: 'rest',
        command: 'GET https://api.search.com?q={query}',
        status: 'inactive',
        enabled: false
    }
]

export default function ToolsPanel() {
    const [tools, setTools] = useState<Tool[]>(dummyTools)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState<Tool>({
        name: '',
        type: '',
        command: '',
        status: 'active',
        enabled: true
    })

    const handleFormChange = (key: keyof Tool, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const addTool = () => {
        setTools(prev => [...prev, form])
        setShowAddModal(false)
        setForm({ name: '', type: '', command: '', status: 'active', enabled: true })
    }

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-white/60" />
                    🛠️ 툴 목록
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    툴 추가
                </button>
            </div>

            {/* Tool Cards */}
            {tools.map((tool, i) => (
                <div
                    key={i}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition"
                >
                    {/* Title & Controls */}
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-white/40" />
                            <span className="text-white font-medium">{tool.name}</span>
                            <span className="text-white/40 text-[10px]">({tool.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="text-white/40 hover:text-white/70">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button className="text-white/40 hover:text-white/70">
                                {tool.enabled
                                    ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                                    : <ToggleLeft className="w-5 h-5 text-white/40" />
                                }
                            </button>
                            <button className="text-white/30 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Command Line */}
                    <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1 break-all">
                        <Link2 className="w-4 h-4" />
                        <span>{tool.command}</span>
                    </div>

                    {/* Status Line */}
                    <div className="flex items-center gap-2">
                        {tool.status === 'active'
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        }
                        <span className={clsx('text-[10px] font-medium', {
                            'text-green-400': tool.status === 'active',
                            'text-red-400': tool.status === 'inactive'
                        })}>
                            {tool.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            ))}

            {/* Add Tool Modal */}
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
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="타입 (예: python, rest)"
                            value={form.type}
                            onChange={e => handleFormChange('type', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="커맨드"
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
        </div>
    )
}