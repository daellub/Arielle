// app/llm/features/components/mcp/LLMModelsPanel.tsx
'use client'

import { AnimatePresence, motion } from 'motion/react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import {
    X,
    Plus,
    Trash2,
    Wifi,
    WifiOff,
    Puzzle,
    RefreshCw,
    Copy,
} from 'lucide-react'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import LLMModelDetail from './LLMModelDetail'
import { mcpHttp } from '@/app/lib/api/mcp'
import { toast } from '@/app/common/toast/useToastStore'

interface LLMModel {
    id: string
    name: string
    model_key: string
    endpoint: string
    type: string
    framework: string
    status: 'active' | 'inactive'
    enabled: boolean
    apiKey?: string
    token?: string
}

const SKELETON_COUNT = 3

export default function LLMModelsPanel() {
    const [models, setModels] = useState<LLMModel[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [expandedModelId, setExpandedModelId] = useState<string | null>(null)

    const activeModelId = useMCPStore(s => s.activeModelId)
    const setActiveModel = useMCPStore(s => s.setActiveModel)
    const updateConfig = useMCPStore(s => (s as any).updateConfig ?? s.upsertConfig)
    const configMap = useMCPStore(s => s.configMap)

    const [newModel, setNewModel] = useState({
        name: '',
        model_key: '',
        endpoint: '',
        type: 'chatbot',
        framework: 'LLaMA',
        status: 'inactive' as 'inactive' | 'active',
        enabled: true,
        apiKey: '',
        token: '',
    })

    const loadModels = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            setRefreshing(silent)

            const res = await mcpHttp.get('/llm/model')
            const list: LLMModel[] = res.data?.models ?? []
            setModels(list)

            list.forEach(m => {
                updateConfig(m.id, {
                    name: m.name,
                    model_key: m.model_key,
                    enabled: m.enabled,
                })
            })
        } catch (error: any) {
            toast.error({ title: '로드 실패', description: '모델 목록을 불러오지 못했습니다.', compact: true })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [updateConfig])

    useEffect(() => {
        loadModels()
    }, [loadModels])

    const onCardClick = useCallback(async (model: LLMModel) => {
        setActiveModel(model.id)
        try {
            const p = mcpHttp.get(`/llm/model/${model.id}/params`)
            await toast.promise(p, {
                loading: { description: '모델 설정 불러오는 중…', compact: true },
                success: { description: '모델 선택됨', compact: true },
                error: { description: '모델 설정 로드 실패', compact: true },
            })
            const { data } = await p
            updateConfig(model.id, {
                name: model.name,
                model_key: model.model_key,
                enabled: model.enabled,
                ...data,
            })
        } catch {}
    }, [setActiveModel, updateConfig])

    const copyEndpoint = useCallback(async (endpoint: string) => {
        try {
            await navigator.clipboard.writeText(endpoint)
            toast.success({ description: '엔드포인트 복사됨', compact: true })
        } catch {
            toast.error({ description: '클립보드 복사 실패', compact: true })
        }
    }, [])

    const toggleModelStatus = useCallback(async (modelId: string, nextEnabled: boolean) => {
        setModels(prev => prev.map(m =>
            m.id === modelId ? { ...m, enabled: nextEnabled, status: nextEnabled ? 'active' : 'inactive' } : m
        ))
        try {
            const model = models.find(m => m.id === modelId)
            if (!model) throw new Error('모델을 찾을 수 없습니다.')

            const body = {
                name: model.name,
                endpoint: model.endpoint,
                type: model.type,
                framework: model.framework,
                enabled: nextEnabled,
                status: nextEnabled ? 'active' : 'inactive',
                apiKey: model.apiKey || '',
                token: model.token || '',
            }

            await toast.promise(
                mcpHttp.patch(`/llm/model/${modelId}`, body),
                {
                    loading: { description: '상태 변경 중…', compact: true },
                    success: { description: `모델이 ${nextEnabled ? '활성화' : '비활성화'}되었습니다.`, compact: true },
                    error: { description: '상태 변경 실패', compact: true },
                }
            )

            updateConfig(modelId, { enabled: nextEnabled })
        } catch (e: any) {
            setModels(prev => prev.map(m =>
                m.id === modelId ? { ...m, enabled: !nextEnabled, status: !nextEnabled ? 'active' : 'inactive' } : m
            ))
        }
    }, [models, updateConfig])

    const confirmDelete = useCallback((modelId: string, name: string) => {
        const id = toast.show({
            variant: 'warning',
            title: '모델 삭제',
            description: `${name} 모델을 삭제할까요?`,
            actionText: '삭제',
            onAction: async () => {
                toast.dismiss(id)
                try {
                    await toast.promise(
                        mcpHttp.delete(`/llm/model/${modelId}`),
                        {
                            loading: { description: '삭제 중…', compact: true },
                            success: { description: '삭제 완료', compact: true },
                            error: { description: '삭제 실패', compact: true },
                        }
                    )
                    await loadModels(true)
                } catch {}
            },
            duration: 8000,
        })
    }, [loadModels])

    const registerModel = useCallback(async () => {
        if (!newModel.name || !newModel.endpoint) {
            toast.info({ description: '모델 이름과 엔드포인트를 입력하세요.', compact: true })
            return
        }
        try {
            await toast.promise(
                mcpHttp.post('/llm/model', newModel),
                {
                    loading: { description: '모델 등록 중…', compact: true },
                    success: { description: '모델 등록 완료', compact: true },
                    error:   { description: '모델 등록 실패', compact: true },
                }
            )
            setShowAddModal(false)
            setNewModel({
                name: '',
                model_key: '',
                endpoint: '',
                type: 'chatbot',
                framework: 'LLaMA',
                status: 'inactive',
                enabled: true,
                apiKey: '',
                token: '',
            })
            await loadModels(true)
        } catch {}
    }, [newModel, loadModels])

    useEffect(() => {
        if (!showAddModal) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddModal(false) }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [showAddModal])

    const activeCount = useMemo(() => models.filter(m => m.enabled).length, [models])

    const invalidUrl = useMemo(() => {
        try { new URL(newModel.endpoint || ''); return false } catch { return true }
    }, [newModel.endpoint])

    const canSubmit = !!(newModel.name?.trim() && newModel.endpoint?.trim() && !invalidUrl)

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white/80">
                    등록된 LLM 모델
                    <span className="ml-2 text-[10px] text-white/50">
                        총 {models.length}개 · 활성 {activeCount}개
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadModels(true)}
                        className={clsx(
                            'flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition',
                            refreshing && 'opacity-70 cursor-not-allowed'
                        )}
                        title="새로고침"
                        disabled={refreshing}
                    >
                        <RefreshCw className={clsx('w-3 h-3', refreshing && 'animate-spin')} />
                        새로고침
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-400 transition"
                    >
                        <Plus className="w-3 h-3" />
                        <span>모델 추가</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <div key={i} className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5">
                            <div className="animate-pulse space-y-2">
                                <div className="h-3 w-40 bg-white/10 rounded" />
                                <div className="h-2 w-64 bg-white/10 rounded" />
                                <div className="h-2 w-24 bg-white/10 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {models.map((model) => {
                        const cfg = configMap[model.id]
                        const isActive = model.id === activeModelId
                        const isExpanded = expandedModelId === model.id

                        return (
                            <div
                                key={model.id}
                                className={clsx(
                                    'relative rounded-xl p-3 ring-1 bg-white/5 hover:bg-white/[.07] transition cursor-pointer',
                                    isActive ? 'ring-indigo-400/50' : 'ring-white/10'
                                )}
                                onClick={() => onCardClick(model)}
                            >
                                <div className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition duration-500"
                                    style={{
                                        background:
                                            'radial-gradient(1200px 200px at 10% -10%, rgba(99,102,241,0.16), transparent 40%), radial-gradient(800px 160px at 110% 120%, rgba(20,184,166,0.12), transparent 40%)'
                                    }}
                                />

                                <div className="flex justify-between items-start gap-2 relative">
                                    <div className="flex items-start gap-2 min-w-0">
                                        <Puzzle className="w-4 h-4 text-white/60 mt-0.5" />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="text-white text-[12px] font-semibold truncate">
                                                    {model.name}
                                                </div>
                                                {model.type && (
                                                    <span className="text-[10px] text-white/50">{model.type}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-white/50 text-[10px]">
                                                <span className="truncate max-w-[48ch]">{model.endpoint}</span>
                                                <button
                                                    className="p-0.5 rounded hover:bg-white/10 text-white/70"
                                                    onClick={(e) => { e.stopPropagation(); copyEndpoint(model.endpoint) }}
                                                    title="엔드포인트 복사"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            className="text-white/60 hover:text-red-400 rounded p-1"
                                            onClick={(e) => { e.stopPropagation(); confirmDelete(model.id, model.name) }}
                                            aria-label="모델 삭제"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-2 ml-0.5">
                                    <div
                                        className="w-7 h-3.5 bg-white/20 rounded-full relative cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); toggleModelStatus(model.id, !(cfg?.enabled ?? model.enabled)) }}
                                        title={(cfg?.enabled ?? model.enabled) ? '비활성화' : '활성화'}
                                    >
                                        <div
                                            className={clsx(
                                                'w-2.5 h-2.5 rounded-full absolute top-0.5 transition-all',
                                                (cfg?.enabled ?? model.enabled) ? 'left-3.5 bg-indigo-400' : 'left-0.5 bg-white/40'
                                            )}
                                        />
                                    </div>

                                    {(cfg?.enabled ?? model.enabled) ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
                                            <Wifi className="w-3 h-3" />
                                            Online
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-300">
                                            <WifiOff className="w-3 h-3" />
                                            Offline
                                        </span>
                                    )}

                                    <div className="ml-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setExpandedModelId(isExpanded ? null : model.id)
                                            }}
                                            className="text-[10px] text-indigo-300 hover:text-indigo-200"
                                        >
                                            {isExpanded ? '▲ 접기' : '▼ 상세 보기'}
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            className="overflow-hidden mt-2"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <LLMModelDetail modelId={model.id} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            )}

            {showAddModal && createPortal(
                <div
                    className={clsx(
                        'fixed inset-0 z-[9999] p-4 flex items-center justify-center',
                        'bg-gradient-to-br from-black/60 via-[#0b0b18]/50 to-black/60',
                        'backdrop-blur-md'
                    )}
                    onClick={() => setShowAddModal(false)}
                >
                    <div className='pointer-events-none absolute inset-0 opacity-40'>
                        <div className='absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl bg-indigo-500/20' />
                        <div className='absolute -bottom-24 -right-20 w-[28rem] h-[28rem] rounded-full blur-3xl bg-fuchsia-500/15' />
                    </div>

                    <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) registerModel()
                            if (e.key === 'Escape') setShowAddModal(false)
                        }}
                        className={clsx(
                            'relative w-full max-w-lg rounded-2xl ring-1 ring-white/10',
                            'bg-gradient-to-b from-[#2c2c3d] to-[#262637]',
                            'scrollLLMArea overflow-y-auto overscroll-contain',
                            'h-[82vh] max-h-[82vh] p-6 space-y-5',
                            'shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]'
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-label="새 LLM 모델 등록"
                    >
                        <div className="sticky top-0 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-gradient-to-b from-[#2c2c3d] to-transparent flex items-center justify-between z-10">
                            <h4 className="text-xl font-semibold text-white tracking-wide">새 LLM 모델 등록</h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/70 hover:text-white rounded-md p-1 transition"
                                aria-label="닫기"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">모델 이름</label>
                            <input
                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                placeholder="예) MiniCPM, Llama3-8B, …"
                                value={newModel.name}
                                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">모델 키 (선택)</label>
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="예) arielle-q6"
                                    value={newModel.model_key}
                                    onChange={(e) => setNewModel({ ...newModel, model_key: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">프레임워크</label>
                                <select
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    value={newModel.framework}
                                    onChange={(e) => setNewModel({ ...newModel, framework: e.target.value })}
                                >
                                    <option className="text-black" value="LLaMA">LLaMA</option>
                                    <option className="text-black" value="PyTorch">PyTorch</option>
                                    <option className="text-black" value="TensorFlow">TensorFlow</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] text-white/60">엔드포인트 URL</label>
                                <span className={invalidUrl
                                    ? 'text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30'
                                    : 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'}>
                                    {invalidUrl ? 'URL 형식 확인 필요' : '유효한 URL'}
                                </span>
                            </div>
                            <input
                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                placeholder="http://localhost:8500/llm/endpoint"
                                value={newModel.endpoint}
                                onChange={(e) => setNewModel({ ...newModel, endpoint: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">타입</label>
                                <select
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    value={newModel.type}
                                    onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
                                >
                                    <option className="text-black" value="chatbot">Chatbot</option>
                                    <option className="text-black" value="qa">QA</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">상태</label>
                                <select
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    value={newModel.status}
                                    onChange={(e) => setNewModel({ ...newModel, status: e.target.value as 'active'|'inactive' })}
                                >
                                    <option className="text-black" value="inactive">Inactive</option>
                                    <option className="text-black" value="active">Active</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">인증 (선택)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="API Key"
                                    value={newModel.apiKey}
                                    onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                                />
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="Bearer Token"
                                    value={newModel.token}
                                    onChange={(e) => setNewModel({ ...newModel, token: e.target.value })}
                                />
                            </div>
                        </div>

                        {!canSubmit && (
                            <div className="rounded-md bg-rose-500/10 ring-1 ring-rose-400/30 p-3 text-[12px] text-rose-200 space-y-1">
                                {!newModel.name?.trim() && <div>· 모델 이름을 입력해 주세요.</div>}
                                {(!newModel.endpoint?.trim() || invalidUrl) && <div>· 엔드포인트 URL을 확인해 주세요.</div>}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className={clsx(
                                    'text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
                                    'text-white/70 hover:text-white bg-white/0 hover:bg-white/10',
                                    'ring-1 ring-white/10 hover:ring-white/20 transition'
                                )}
                            >
                                닫기
                            </button>
                            <button
                                onClick={registerModel}
                                disabled={!canSubmit}
                                className={canSubmit
                                    ? 'text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white ring-1 ring-indigo-300/40 hover:from-indigo-400 hover:to-fuchsia-400 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition'
                                    : 'text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium opacity-60 cursor-not-allowed bg-white/10 text-white/60 ring-1 ring-white/10'}
                            >
                                등록
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}