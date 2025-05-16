'use client'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Trash2,
    RefreshCw,
    HardDrive,
    Folder,
    Plus,
    X,
    Database,
    Link2,
    CheckCircle,
    XCircle,
    Save,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'
import clsx from 'clsx'

import {
    getLocalSources,
    addLocalSource,
    updateLocalSource,
    deleteLocalSource
} from '@/app/llm/hooks/useMCPSource'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'

declare global {
    interface Window {
        electron: any;
    }
}

interface LocalSource {
    id?: number
    name: string
    path: string
    type: 'folder' | 'database'
    status: 'active' | 'inactive'
    enabled: boolean
    host?: string
    port?: string
    username?: string
    password?: string
}

export default function LocalSourcesPanel() {
    const [sources, setSources] = useState<LocalSource[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState<LocalSource>({
        name: '',
        path: '',
        type: 'folder',
        status: 'active',
        enabled: true
    })
    const activeModelId = useMCPStore(s => s.activeModelId)
    const [linkedIds, setLinkedIds] = useState<number[]>([])

    const notify = useNotificationStore((s) => s.show)

    const loadSources = async () => {
        const data = await getLocalSources()
        setSources(data)
    }

    const loadLinkedIds = async () => {
        if (!activeModelId) return
        try {
            const res = await axios.get(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/sources`
            )
            const ids = (res.data.sources || []).map((s: any) => s.source_id)
            setLinkedIds(ids)
        } catch (err) {
            console.error('소스 연결 정보 로드 실패:', err)
        }
    }

    useEffect(() => { loadSources() }, [])
    useEffect(() => { loadLinkedIds() }, [activeModelId])

    const handleFormChange = (key: keyof LocalSource, value: any) =>
        setForm(prev => ({ ...prev, [key]: value || '' }))

    const addSource = async () => {
        await addLocalSource(form)
        loadSources()
        setShowAddModal(false)
        setForm({
            name: '',
            path: '',
            type: 'folder',
            status: 'active',
            enabled: true
        })

        notify('로컬 소스를 등록했습니다', 'success')
    }

    const handleDeleteSource = async (id?: number) => {
        if (!id) return notify('소스 ID가 잘못되었습니다.', 'error')
        await deleteLocalSource(id)
        await loadSources()
        notify('소스를 삭제했습니다.', 'error')
    }

    const toggleEnable = async (id: number | undefined) => {
        if (!id) return notify('소스 ID가 잘못되었습니다.', 'error')
        const source = sources.find(s => s.id === id)
        if (!source) return notify('소스를 찾을 수 없습니다.', 'error')

        const updated = {
            ...source,
            enabled: !source.enabled,
            status: (!source.enabled ? 'active' : 'inactive') as 'active' | 'inactive'
        }

        await updateLocalSource(id, updated)
        setSources(prev => prev.map(s => s.id === id ? { ...updated } : s))
        notify('소스 상태를 변경했습니다.', 'info')
    }

    const handleUpdateSource = async (id: number | undefined) => {
        if (!id) return notify('소스 ID가 잘못되었습니다.', 'error')
        const updated = sources.find(s => s.id === id)
        if (!updated) return
        await updateLocalSource(id, updated)
        loadSources()

        notify('소스 상태를 업데이트했습니다.', 'info')
    }

    const handleToggleLink = async (sourceId: number) => {
        if (!activeModelId) return

        const updated = linkedIds.includes(sourceId)
            ? linkedIds.filter(id => id !== sourceId)
            : [...linkedIds, sourceId]

        setLinkedIds(updated)

        const updatedLocalSources = sources
        .filter(src => updated.includes(src.id!) && src.enabled)
        .map(src => src.id!)

        const sourcePayload = {
            sources: updatedLocalSources.map(id => ({
                source_id: id,
                source_type: 'local'
            }))
        }

        try {
            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/sources?source_type=local`,
                sourcePayload
            )

            const paramRes = await axios.get(`http://localhost:8500/mcp/llm/model/${activeModelId}/params`)
            const currentParams = paramRes.data || {}

            const newParams = {
                ...currentParams,
                local_sources: updatedLocalSources,
            }

            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/params`,
                newParams
            )

            notify('Local 연결 정보가 업데이트되었습니다.', 'success')
        } catch (err) {
            console.error('연결 정보 업데이트 실패:', err)
            notify('연결 정보를 업데이트하지 못했습니다.', 'error')
        }
    }

    const selectPath = async () => {
        const result = await window.electronAPI.openModelDialog()
        if (result) setForm(prev => ({ ...prev, path: result }))
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1">
                    <Folder className="w-4 h-4 text-white/40" />
                    Local 소스
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    소스 추가
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
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={() => handleUpdateSource(src.id)}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={() => toggleEnable(src.id)}
                            >
                                {src.enabled
                                    ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                                    : <ToggleLeft className="w-5 h-5 text-white/40" />
                                }
                            </button>
                            <button
                                onClick={() => handleDeleteSource(src.id)}
                                className="text-white/30 hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1 break-all">
                        <Link2 className="w-4 h-4" />
                        <span>{src.path}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {src.enabled
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        }
                        <span className={clsx('text-[10px] font-medium', {
                            'text-green-400': src.enabled,
                            'text-red-400': !src.enabled
                        })}>
                            {src.enabled ? 'Active' : 'Inactive'}
                        </span>
                        <button
                            onClick={() => {
                                console.log('clicked', src.id)
                                handleToggleLink(src.id!)
                            }}
                            className={clsx(
                                'px-2 py-0.5 rounded-full text-[10px] border transition',
                                linkedIds.includes(src.id!)
                                    ? 'bg-indigo-500 text-white border-indigo-400'
                                    : 'bg-white/10 text-white/40 border-white/20 hover:bg-white/20'
                            )}
                        >
                            {linkedIds.includes(src.id!) ? '연결됨' : '미연결'}
                        </button>
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
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <input
                                className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                placeholder="이름"
                                value={form.name}
                                onChange={e => handleFormChange('name', e.target.value)}
                            />

                            {form.type === 'database' ? (
                                <div className="space-y-2">
                                    <input
                                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                        placeholder="Database Host (예: localhost)"
                                        value={form.host}
                                        onChange={e => handleFormChange('host', e.target.value)}
                                    />
                                    <input
                                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                        placeholder="Database Port (예: 3306)"
                                        value={form.port}
                                        onChange={e => handleFormChange('port', e.target.value)}
                                    />
                                    <input
                                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                        placeholder="Username"
                                        value={form.username}
                                        onChange={e => handleFormChange('username', e.target.value)}
                                    />
                                    <input
                                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                        placeholder="Password"
                                        type="password"
                                        value={form.password}
                                        onChange={e => handleFormChange('password', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="gap-2">
                                    <input
                                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                        placeholder="경로"
                                        value={form.path}
                                        onChange={e => handleFormChange('path', e.target.value)}
                                    />
                                    <button
                                        onClick={selectPath}
                                        className="text-indigo-300 text-xs hover:text-indigo-400 transition"
                                    >
                                        폴더 선택
                                    </button>
                                </div>
                            )}

                            <select
                                className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                value={form.type}
                                onChange={e => handleFormChange('type', e.target.value as 'folder' | 'database')}
                            >
                                <option className='text-black' value="folder">Folder</option>
                                <option className='text-black' value="database">Database</option>
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

                            <div className="flex justify-end gap-4 pt-2">
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
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}