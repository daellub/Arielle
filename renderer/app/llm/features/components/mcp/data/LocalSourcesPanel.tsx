'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Trash2,
    RefreshCw,
    HardDrive,
    Database,
    Link2,
    CheckCircle,
    XCircle,
    Save,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import clsx from 'clsx'

interface LocalSource {
    name: string
    path: string
    type: 'folder' | 'database'
    status: 'active' | 'inactive'
    enabled: boolean
}

const dummySources: LocalSource[] = [
    { name: '문서 폴더', path: '/Users/dael/Documents', type: 'folder', status: 'active', enabled: true },
    { name: 'ASR 결과 DB', path: 'mysql://localhost:3306/asr_db', type: 'database', status: 'inactive', enabled: false }
]

export default function LocalSourcesPanel() {
    const [sources, setSources] = useState<LocalSource[]>(dummySources)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState<LocalSource>({
        name: '',
        path: '',
        type: 'folder',
        status: 'active',
        enabled: true
    })

    const handleFormChange = (key: keyof LocalSource, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const addSource = () => {
        setSources(prev => [...prev, form])
        setShowAddModal(false)
        setForm({ name: '', path: '', type: 'folder', status: 'active', enabled: true })
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1">
                    📁 Local 소스
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                >
                    + 소스 추가
                </button>
            </div>

            {sources.map((src, i) => (
                <div
                    key={i}
                    className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition"
                >
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            {src.type === 'folder'
                                ? <HardDrive className="w-4 h-4 text-white/40" />
                                : <Database className="w-4 h-4 text-white/40" />
                            }
                            <span className="text-white font-medium">{src.name}</span>
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
                        <span>{src.path}</span>
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
                                새 Local 소스 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white"
                            >✕</button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="이름"
                            value={form.name}
                            onChange={e => handleFormChange('name', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="경로"
                            value={form.path}
                            onChange={e => handleFormChange('path', e.target.value)}
                        />
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={form.type}
                            onChange={e => handleFormChange('type', e.target.value as 'folder' | 'database')}
                        >
                            <option value="folder">Folder</option>
                            <option value="database">Database</option>
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