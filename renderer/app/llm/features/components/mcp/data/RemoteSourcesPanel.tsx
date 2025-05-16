// app/llm/features/components/mcp/data/RemoteSourcesPanel.tsx
'use client'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Trash2,
    RefreshCw,
    Globe,
    X,
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

import {
    getRemoteSources, 
    addRemoteSource,
    updateRemoteSource,
    deleteRemoteSource
} from '@/app/llm/hooks/useMCPSource'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'

interface RemoteSource {
    id?: number
    name: string
    endpoint: string
    auth: boolean
    status: 'active' | 'inactive'
    enabled: boolean
}

export default function RemoteSourcesPanel() {
    const [sources, setSources] = useState<RemoteSource[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState<RemoteSource>({
        name: '',
        endpoint: '',
        auth: false,
        status: 'active',
        enabled: true
    })
    const activeModelId = useMCPStore(s => s.activeModelId)
    const [linkedIds, setLinkedIds] = useState<number[]>([])

    const notify = useNotificationStore((s) => s.show)

    useEffect(() => {
        loadSources()
    }, [])

    useEffect(() => {
        if (!activeModelId) return
        axios.get(`http://localhost:8500/mcp/llm/model/${activeModelId}/sources`)
            .then(res => {
                const onlyRemote = res.data.sources.filter((s: any) => s.source_type === 'remote')
                setLinkedIds(onlyRemote.map((s: any) => s.source_id))
            })
            .catch(err => {
                console.error('Remote 연결 정보 불러오기 실패:', err)
            })
    }, [activeModelId])

    const loadSources = async () => {
        const data = await getRemoteSources()
        setSources(data)
    }

    const handleFormChange = (key: keyof RemoteSource, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const toggleEnable = async (id: number | undefined) => {
        if (id === undefined) {
            notify('소스 ID가 잘못되었습니다.', 'error')
            return
        }

        const source = sources.find(src => src.id === id)
        if (!source) {
            notify('소스를 찾을 수 없습니다.', 'error')
            return
        }

        const updatedSource = {
            ...source,
            enabled: !source.enabled,
            status: (!source.enabled ? 'active' : 'inactive') as 'active' | 'inactive'
        }

        setSources(prev =>
            prev.map((s) =>
                s.id === id
                    ? updatedSource
                    : s
            )
        )

        await updateRemoteSource(id, updatedSource)

        notify('소스 상태가 변경되었습니다.', 'info')
    }


    const addSource = async () => {
        await addRemoteSource(form)
        loadSources()
        setShowAddModal(false)
        setForm({
            name: '',
            endpoint: '',
            auth: false,
            status: 'active',
            enabled: true
        })

        notify('소스가 추가되었습니다.', 'info')
    }
    
    const handleUpdateSource = async (id: number | undefined) => {
        if (id === undefined) {
            notify('소스 ID가 잘못되었습니다.', 'error')
            return
        }

        const updatedSource = sources.find(s => s.id === id)
        if (!updatedSource) return

        await updateRemoteSource(id, updatedSource)
        loadSources()

        notify('소스 상태를 업데이트했습니다.', 'info')
    }

    const handleDeleteSource = async (id: number | undefined) => {
        if (id === undefined) {
            notify('소스 ID가 잘못되었습니다.', 'error')
            return
        }

        await deleteRemoteSource(id)
        loadSources()

        notify('소스가 삭제되었습니다.', 'info')
    }

    const handleToggleLink = async (sourceId: number) => {
        if (!activeModelId) {
            notify('먼저 모델을 선택해 주세요.', 'error')
            return
        }

        const updated = linkedIds.includes(sourceId)
            ? linkedIds.filter(id => id !== sourceId)
            : [...linkedIds, sourceId]

        setLinkedIds(updated)

        const updatedRemoteSources = sources
            .filter(src => updated.includes(src.id!) && src.enabled)
            .map(src => src.id!)

        const payload = {
            sources: updatedRemoteSources.map(id => ({
                source_id: id,
                source_type: 'remote'
            }))
        }

        try {
            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/sources?source_type=remote`,
                payload
            )
            
            const currentParamsRes = await axios.get(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/params`
            )
            const currentParams = currentParamsRes.data || {}

            const newParams = {
                ...currentParams,
                remote_sources: updatedRemoteSources
            }

            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/params`,
                newParams
            )

            notify('Remote 연결 정보가 업데이트되었습니다.', 'success')
        } catch (err) {
            console.error('연결 정보 업데이트 실패:', err)
            notify('연결 정보를 업데이트하지 못했습니다.', 'error')
        }
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
                        <button
                            onClick={() => handleToggleLink(src.id!)}
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
                                새 Remote API 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-5 h-5" />
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