'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Trash2,
    RefreshCw,
    Globe,
    Lock,
    CheckCircle,
    XCircle,
    Save,
    Link2,
    Plus,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import clsx from 'clsx'

interface RemoteSource {
    name: string
    endpoint: string
    auth: boolean
    status: 'active' | 'inactive'
    enabled: boolean
}

const dummyRemoteSources: RemoteSource[] = [
    { name: 'HuggingFace API', endpoint: 'https://api.huggingface.co/llm/infer', auth: true, status: 'active', enabled: true },
    { name: 'ArliAI Log API', endpoint: 'http://127.0.0.1:5001/logs', auth: false, status: 'inactive', enabled: false }
]

export default function RemoteSourcesPanel() {
    const [sources, setSources] = useState<RemoteSource[]>(dummyRemoteSources)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState<RemoteSource>({
        name: '',
        endpoint: '',
        auth: false,
        status: 'active',
        enabled: true
    })

    const handleFormChange = (key: keyof RemoteSource, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const addSource = () => {
        setSources(prev => [...prev, form])
        setShowAddModal(false)
        setForm({ name: '', endpoint: '', auth: false, status: 'active', enabled: true })
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-white/60" />
                    Remote 소스
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    API 추가
                </button>
            </div>

            {sources.map((src, i) => (
                <div
                    key={i}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition"
                >
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-white/40" />
                            <span className="text-white font-medium">{src.name}</span>
                            {src.auth && <Lock className="w-4 h-4 text-yellow-400 ml-1" />}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="text-white/40 hover:text-white/70">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button className="text-white/40 hover:text-white/70">
                                {src.enabled
                                    ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                                    : <ToggleLeft className="w-5 h-5 text-white/40" />
                                }
                            </button>
                            <button className="text-white/30 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1 break-all">
                        <Link2 className="w-4 h-4" />
                        <span>{src.endpoint}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {src.status === 'active'
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        }
                        <span className={clsx('text-[10px] font-medium', {
                            'text-green-400': src.status === 'active',
                            'text-red-400': src.status === 'inactive'
                        })}>
                            {src.status === 'active' ? 'Active' : 'Inactive'}
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
                                새 Remote API 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="이름"
                            value={form.name}
                            onChange={e => handleFormChange('name', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="Endpoint URL"
                            value={form.endpoint}
                            onChange={e => handleFormChange('endpoint', e.target.value)}
                        />
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={String(form.auth)}
                            onChange={e => handleFormChange('auth', e.target.value === 'true')}
                        >
                            <option value="false">Auth 없음</option>
                            <option value="true">Auth 필요</option>
                        </select>
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
                                onClick={addSource}
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