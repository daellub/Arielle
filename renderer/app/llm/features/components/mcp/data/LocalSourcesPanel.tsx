'use client'

import axios from 'axios'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
    ToggleRight,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

import {
    getLocalSources,
    addLocalSource,
    updateLocalSource,
    deleteLocalSource
} from '@/app/llm/hooks/useMCPSource'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { toast } from '@/app/common/toast/useToastStore'

declare global {
    interface Window {
        electron?: {
            openModelDialog: () => Promise<string | null>
        }
    }
}

type SourceStatus = 'active' | 'inactive'
type SourceType = 'folder' | 'database'

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

type LinkedFilter = 'all' | 'linked' | 'unlinked'
type EnabledFilter = 'all' | 'active' | 'inactive'
type TypeFilter = 'all' | 'folder' | 'database'

const MCP_BASE = (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'

export default function LocalSourcesPanel() {
    const [sources, setSources] = useState<LocalSource[]>([])
    const [loading, setLoading] = useState(false)

    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
    const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all')
    const [linkedFilter, setLinkedFilter] = useState<LinkedFilter>('all')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

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

    const loadAbortRef = useRef<AbortController | null>(null)
    const searchDebounceRef = useRef<number | null>(null)

    const apiModel = useMemo(
        () => ({
            sources: (modelId: string) => `${MCP_BASE}/mcp/llm/model/${modelId}/sources`,
            params: (modelId: string) => `${MCP_BASE}/mcp/llm/model/${modelId}/params`,
        }),
        []
    )

    const handleFormChange = useCallback(
        (key: keyof LocalSource, value: any) => 
            setForm((prev) => ({ ...prev, [key]: value ?? '' })),
        []
    )

    const loadSources = useCallback(async () => {
        if (loadAbortRef.current) loadAbortRef.current.abort()
        const ac = new AbortController()
        loadAbortRef.current = ac

        setLoading(true)
        const res = await getLocalSources({ signal: ac.signal })
        setLoading(false)

        if (res.ok) {
            setSources(res.data as unknown as LocalSource[])
        } else {
            toast.error({ title: '로컬 소스 로드 실패', description: res.error, compact: true })
        }
    }, [])

    const loadLinkedIds = useCallback(async () => {
        if (!activeModelId) {
            setLinkedIds([])
            return
        }

        try {
            const { data } = await axios.get(apiModel.sources(activeModelId))
            const ids = (data?.sources ?? []).map((s: any) => s.source_id as number)
            setLinkedIds(ids)
        } catch (err: any) {
            toast.error({
                title: '연결 정보 로드 실패',
                description: err?.message ?? '불러오는 중 오류가 발생했습니다.',
                compact: true,
            })
        }
    }, [activeModelId, apiModel])

    useEffect(() => {
        loadSources()
        return () => {
            loadAbortRef.current?.abort()
        }
    }, [loadSources])

    useEffect(() => {
        loadLinkedIds()
    }, [loadLinkedIds])

    const onChangeQuery = useCallback((v: string) => {
        setQuery(v)
        if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = window.setTimeout(() => {
            setPage(1)
        }, 200)
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return sources.filter((s) => {
            if (q) {
                const hay = `${s.name} ${s.path ?? ''}`.toLowerCase()
                if (!hay.includes(q)) return false
            }
            if (typeFilter !== 'all' && s.type !== typeFilter) return false
            if (enabledFilter === 'active' && !s.enabled) return false
            if (enabledFilter === 'inactive' && s.enabled) return false
            if (linkedFilter === 'linked' && !linkedIds.includes(s.id!)) return false
            if (linkedFilter === 'unlinked' && linkedIds.includes(s.id!)) return false
            return true
        })
    }, [sources, query, typeFilter, enabledFilter, linkedFilter, linkedIds])

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const pageData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, currentPage, pageSize])

    useEffect(() => {
        setPage(1)
    }, [typeFilter, enabledFilter, linkedFilter])

    const resetForm = useCallback(() => {
        setForm({
            name: '',
            path: '',
            type: 'folder',
            status: 'active',
            enabled: true,
        })
    }, [])

    const submitDisabled =
        !form?.name?.trim() ||
        (form.type === 'database'
            ? !form.host?.trim() || !String(form.port ?? '').trim() || !form.username?.trim() || !form.password?.trim()
            : !form.path?.trim());

    const validateForm = useCallback((f: LocalSource) => {
        const errs: string[] = []
        if (!f.name.trim()) errs.push('이름은 필수입니다.')
        if (f.type === 'folder') {
            if (!f.path.trim()) errs.push('폴더 경로는 필수입니다.')
        } else {
            if (!f.host?.trim()) errs.push('DB Host는 필수입니다.')
            if (!f.port?.trim() || Number.isNaN(Number(f.port))) errs.push('DB Port는 숫자여야 합니다.')
            if (!f.username?.trim()) errs.push('DB Username은 필수입니다.')
        }
        return errs
    }, [])

    const addSource = useCallback(async () => {
        const errs = validateForm(form)
        if (errs.length) {
            toast.warning({ title: '입력값을 확인하세요', description: errs.join('\n'), compact: false, duration: 5000 })
            return
        }

        const res = await addLocalSource(form)
        if (res.ok) {
            await loadSources()
            setShowAddModal(false)
            resetForm()
            toast.success({ title: '등록 완료', description: '로컬 소스를 등록했습니다.', compact: true })
        } else {
            toast.error({ title: '등록 실패', description: res.error, compact: true })
        }
    }, [form, validateForm, loadSources, resetForm])

    const handleDeleteSource = useCallback(
        async (id?: number) => {
            if (!id) {
                toast.error({ title: '소스 ID가 잘못되었습니다.', compact: true })
                return
            }
            const prev = sources
            setSources((s) => s.filter((x) => x.id !== id))
            const res = await deleteLocalSource(id)
            if (res.ok) {
                toast.success({ title: '삭제 완료', description: '소스를 삭제했습니다.', compact: true })
            } else {
                setSources(prev)
                toast.error({ title: '삭제 실패', description: res.error, compact: true })
            }
        },
        [sources]
    )

    const toggleEnable = useCallback(
        async (id?: number) => {
            if (!id) {
                toast.error({ title: '소스 ID가 잘못되었습니다.', compact: true })
                return
            }
            const src = sources.find((s) => s.id === id)
            if (!src) {
                toast.error({ title: '소스를 찾을 수 없습니다.', compact: true })
                return
            }
            const next: LocalSource = {
                ...src,
                enabled: !src.enabled,
                status: (!src.enabled ? 'active' : 'inactive') as SourceStatus,
            }

            setSources((list) => list.map((s) => (s.id === id ? next : s)))
            const res = await updateLocalSource(id, next)
            if (res.ok) {
                toast.info({ title: '상태 변경됨', description: next.enabled ? '활성화됨' : '비활성화됨', compact: true })
            } else {
                setSources((list) => list.map((s) => (s.id === id ? src : s)))
                toast.error({ title: '상태 변경 실패', description: res.error, compact: true })
            }
        },
        [sources]
    )

    const handleUpdateSource = useCallback(
        async (id?: number) => {
            if (!id) {
                toast.error({ title: '소스 ID가 잘못되었습니다.', compact: true })
                return
            }
            const updated = sources.find((s) => s.id === id)
            if (!updated) return

            const res = await updateLocalSource(id, updated)
            if (res.ok) {
                toast.info({ title: '업데이트됨', description: '소스가 업데이트되었습니다.', compact: true })
                loadSources()
            } else {
                toast.error({ title: '업데이트 실패', description: res.error, compact: true })
            }
        },
        [sources, loadSources]
    )

    const handleToggleLink = useCallback(
        async (sourceId: number) => {
            if (!activeModelId) {
                toast.info({ title: '모델을 먼저 선택하세요', compact: true })
                return
            }

            const nextLinked = linkedIds.includes(sourceId)
                ? linkedIds.filter((id) => id !== sourceId)
                : [...linkedIds, sourceId]
            setLinkedIds(nextLinked)

            const updatedLocalSources = sources
                .filter((src) => nextLinked.includes(src.id!) && src.enabled)
                .map((src) => src.id!)

            const sourcePayload = {
                sources: updatedLocalSources.map((id) => ({
                    source_id: id,
                    source_type: 'local',
                })),
            }

            try {
                await axios.patch(`${apiModel.sources(activeModelId)}?source_type=local`, sourcePayload)

                const paramRes = await axios.get(apiModel.params(activeModelId))
                const currentParams = paramRes.data || {}

                const newParams = {
                    ...currentParams,
                    local_sources: updatedLocalSources,
                }
                await axios.patch(apiModel.params(activeModelId), newParams)

                toast.success({ title: '연결 정보 업데이트', description: 'Local 연결이 반영되었습니다.', compact: true })
            } catch (err: any) {
                setLinkedIds((prev) =>
                    prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
                )
                toast.error({
                    title: '연결 실패',
                    description: err?.message ?? '연결 정보를 업데이트하지 못했습니다.',
                    compact: true,
                })
            }
        },
        [activeModelId, linkedIds, sources, apiModel]
    )

    const selectPath = useCallback(async () => {
        try {
            const result = await window.electronAPI?.openModelDialog()
            if (result) setForm((prev) => ({ ...prev, path: result }))
        } catch (e: any) {
            toast.error({ title: '경로 선택 실패', description: e?.message ?? '오류가 발생했습니다.', compact: true })
        }
    }, [])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-1">
                    <Folder className="w-4 h-4 text-white/40" />
                    Local 소스
                    <span className='ml-2 text-[11px] text-white/40'>
                        총 {sources.length}개 · 활성화 {sources.filter((src) => src.enabled).length}개
                    </span>
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadSources}
                        className="text-xs text-white/50 hover:text-white/80 transition flex items-center gap-1"
                        title="새로고침"
                    >
                        <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                        새로고침
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="text-xs text-indigo-300 hover:text-indigo-400 transition flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        소스 추가
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-md p-2">
                <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        className="w-full pl-7 pr-3 py-1.5 rounded bg-white/10 text-white text-xs placeholder-white/40"
                        placeholder="이름/경로 검색…"
                        value={query}
                        onChange={(e) => onChangeQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-white/60 flex-wrap">
                    <Filter className="w-4 h-4 hidden sm:block" />
                    <select
                        className="shrink-0 w-[88px] sm:w-[88px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                    >
                        <option className="text-black" value="all">모두</option>
                        <option className="text-black" value="folder">Folder</option>
                        <option className="text-black" value="database">Database</option>
                    </select>
                    <select
                        className="shrink-0 w-[88px] sm:w-[88px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
                        value={enabledFilter}
                        onChange={(e) => setEnabledFilter(e.target.value as EnabledFilter)}
                    >
                        <option className="text-black" value="all">상태(전체)</option>
                        <option className="text-black" value="active">Active</option>
                        <option className="text-black" value="inactive">Inactive</option>
                    </select>
                    <select
                        className="shrink-0 w-[68px] sm:w-[70px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
                        value={linkedFilter}
                        onChange={(e) => setLinkedFilter(e.target.value as LinkedFilter)}
                    >
                        <option className="text-black" value="all">연결</option>
                        <option className="text-black" value="linked">연결됨</option>
                        <option className="text-black" value="unlinked">미연결</option>
                    </select>
                </div>

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-[11px] text-white/40">페이지 크기</span>
                    <select
                        className="w-[60px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value))
                            setPage(1)
                        }}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} className="text-black" value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>

            {pageData.map((src) => (
                <div key={src.id ?? src.name} className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            {src.type === 'folder' ? (
                                <HardDrive className="w-4 h-4 text-white/40" />
                            ) : (
                                <Database className="w-4 h-4 text-white/40" />
                            )}
                            <span className="text-white font-medium">{src.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={() => handleUpdateSource(src.id)}
                                title="업데이트"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                className="text-white/40 hover:text-white/70"
                                onClick={() => toggleEnable(src.id)}
                                title={src.enabled ? '비활성화' : '활성화'}
                            >
                                {src.enabled ? (
                                    <ToggleRight className="w-5 h-5 text-indigo-400" />
                                ) : (
                                    <ToggleLeft className="w-5 h-5 text-white/40" />
                                )}
                            </button>
                            <button
                                onClick={() => handleDeleteSource(src.id)}
                                className="text-white/30 hover:text-red-400"
                                title="삭제"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1 break-all">
                        <Link2 className="w-4 h-4" />
                        <span>{src.type === 'folder' ? src.path : `${src.host}:${src.port}`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {src.enabled ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span
                            className={clsx('text-[10px] font-medium', {
                                'text-green-400': src.enabled,
                                'text-red-400': !src.enabled,
                            })}
                        >
                            {src.enabled ? 'Active' : 'Inactive'}
                        </span>
                        <button
                            onClick={() => src.id && handleToggleLink(src.id)}
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

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                        className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs disabled:opacity-40"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        title="이전"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[12px] text-white/70">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs disabled:opacity-40"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        title="다음"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {showAddModal &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-gradient-to-br from-black/60 via-[#0b0b18]/50 to-black/60 backdrop-blur-md"
                        onClick={() => setShowAddModal(false)}
                    >
                        <div className="pointer-events-none absolute inset-0 opacity-40">
                            <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl bg-indigo-500/20" />
                            <div className="absolute -bottom-24 -right-20 w-[28rem] h-[28rem] rounded-full blur-3xl bg-fuchsia-500/15" />
                        </div>

                        <div
                            className="relative w-full max-w-lg rounded-2xl ring-1 ring-white/10 bg-gradient-to-b from-[#2c2c3d] to-[#262637] p-6 space-y-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !submitDisabled) addSource()
                                if (e.key === 'Escape') setShowAddModal(false)
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="새 Local 소스 등록"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-semibold text-white tracking-wide">
                                    새 Local 소스 등록
                                </h4>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-white/70 hover:text-white rounded-md p-1 transition"
                                    aria-label="닫기"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">이름</label>
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="예) AI 문서 폴더 / 실험용 DB"
                                    value={form.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {form.type === 'database' ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-white/60">Database Host</label>
                                            <input
                                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                                placeholder="localhost"
                                                value={form.host ?? ''}
                                                onChange={(e) => handleFormChange('host', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-white/60">Database Port</label>
                                            <input
                                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                                placeholder="3306"
                                                value={form.port ?? ''}
                                                onChange={(e) => handleFormChange('port', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-white/60">Username</label>
                                            <input
                                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                                placeholder="db_user"
                                                value={form.username ?? ''}
                                                onChange={(e) => handleFormChange('username', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-white/60">Password</label>
                                            <input
                                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                                type="password"
                                                placeholder="********"
                                                value={form.password ?? ''}
                                                onChange={(e) => handleFormChange('password', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">경로</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="flex-1 rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                            placeholder="예) C:\data\docs 또는 /Users/me/docs"
                                            value={form.path}
                                            onChange={(e) => handleFormChange('path', e.target.value)}
                                        />
                                        <button
                                            onClick={selectPath}
                                            className="shrink-0 text-[12px] rounded-md px-2.5 py-1 ring-1 ring-indigo-400/40 text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 transition"
                                            type="button"
                                        >
                                            폴더 선택
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">종류</label>
                                    <select
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        value={form.type}
                                        onChange={(e) => handleFormChange('type', e.target.value as SourceType)}
                                    >
                                        <option className="text-black" value="folder">Folder</option>
                                        <option className="text-black" value="database">Database</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">상태</label>
                                    <select
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        value={form.status}
                                        onChange={(e) => handleFormChange('status', e.target.value as SourceStatus)}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <label className="inline-flex items-center gap-2 select-none">
                                <input
                                    type="checkbox"
                                    checked={form.enabled}
                                    onChange={(e) => handleFormChange('enabled', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-white text-sm">Enabled</span>
                            </label>

                            {submitDisabled && (
                                <div className="rounded-md bg-rose-500/10 ring-1 ring-rose-400/30 p-3 text-[12px] text-rose-200 space-y-1">
                                    {!form?.name?.trim() && <div>· 이름을 입력해 주세요.</div>}
                                    {form.type === 'database' ? (
                                        <>
                                            {!form?.host?.trim() && <div>· Database Host가 필요합니다.</div>}
                                            {!String(form?.port ?? '').trim() && <div>· Database Port가 필요합니다.</div>}
                                            {!form?.username?.trim() && <div>· Username이 필요합니다.</div>}
                                            {!form?.password?.trim() && <div>· Password가 필요합니다.</div>}
                                        </>
                                    ) : (
                                        !form?.path?.trim() && <div>· 경로를 입력하거나 폴더를 선택해 주세요.</div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white/70 hover:text-white bg-white/0 hover:bg-white/10 ring-1 ring-white/10 hover:ring-white/20 transition"
                                    type="button"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={addSource}
                                    disabled={submitDisabled}
                                    className={
                                        submitDisabled
                                            ? 'text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium opacity-60 cursor-not-allowed bg-white/10 text-white/60 ring-1 ring-white/10'
                                            : 'text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white ring-1 ring-indigo-300/40 hover:from-indigo-400 hover:to-fuchsia-400 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition'
                                    }
                                    type="button"
                                >
                                    <Save className="w-4 h-4" />
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