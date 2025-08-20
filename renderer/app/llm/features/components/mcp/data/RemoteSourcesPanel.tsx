// app/llm/features/components/mcp/data/RemoteSourcesPanel.tsx
'use client'

import axios from 'axios'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
    ToggleRight,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

import {
    getRemoteSources,
    addRemoteSource,
    updateRemoteSource,
    deleteRemoteSource,
} from '@/app/llm/hooks/useMCPSource'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { toast } from '@/app/common/toast/useToastStore'

type SourceStatus = 'active' | 'inactive'
interface RemoteSource {
    id?: number
    name: string
    endpoint: string
    auth: boolean
    status: SourceStatus
    enabled: boolean
}

type LinkedFilter = 'all' | 'linked' | 'unlinked'
type EnabledFilter = 'all' | 'active' | 'inactive'
type AuthFilter = 'all' | 'auth' | 'noauth'

type AuthType = 'apiKey' | 'bearer' | 'basic' | 'custom'
type ApiKeyPlacement = 'header' | 'query'
type HeaderRow = { id: string; key: string; value: string }

const MCP_BASE = (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'

const INITIAL_FORM = {
    name: '',
    endpoint: '',
    auth: false,
    authType: 'apiKey' as AuthType,
    apiKeyName: 'Authorization',
    apiKeyValue: '',
    apiKeyPlacement: 'header' as ApiKeyPlacement,
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    headers: [] as HeaderRow[],
    status: 'active' as SourceStatus,
    enabled: true,
}

export default function RemoteSourcesPanel() {
    const [sources, setSources] = useState<RemoteSource[]>([])
    const [loading, setLoading] = useState(false)

    const [query, setQuery] = useState('')
    const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all')
    const [linkedFilter, setLinkedFilter] = useState<LinkedFilter>('all')
    const [authFilter, setAuthFilter] = useState<AuthFilter>('all')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState({ ...INITIAL_FORM })

    const activeModelId = useMCPStore((s) => s.activeModelId)
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

    const handleFormChange = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }))

    const addHeaderRow = () =>
        setForm((prev) => ({
            ...prev,
            headers: [...prev.headers, { id: Math.random().toString(36).slice(2), key: '', value: '' }],
        }))

    const updateHeaderRow = (id: string, key: 'key' | 'value', value: string) =>
        setForm((prev) => ({
            ...prev,
            headers: prev.headers.map((h) => (h.id === id ? { ...h, [key]: value } : h)),
        }))

    const removeHeaderRow = (id: string) =>
        setForm((prev) => ({ ...prev, headers: prev.headers.filter((h) => h.id !== id) }))

    const invalidUrl = (() => {
        try {
            if (!form?.endpoint?.trim()) return true
            new URL(form.endpoint)
            return false
        } catch {
            return true
        }
    })()

    const authMissing =
        form.auth &&
        (() => {
            switch (form.authType) {
                case 'apiKey':
                    return !form.apiKeyName.trim() || !form.apiKeyValue.trim()
                case 'bearer':
                    return !form.bearerToken.trim()
                case 'basic':
                    return !form.basicUsername.trim() || !form.basicPassword.trim()
                case 'custom':
                    return form.headers.length > 0 && form.headers.some((h) => !h.key.trim())
                default:
                    return false
            }
        })()

    const submitDisabled = !form.name.trim() || invalidUrl || Boolean(authMissing)

    const buildAuthPreview = () => {
        const url = new URL(form.endpoint || 'https://example.com')
        const headers: Record<string, string> = {}

        if (form.auth) {
            if (form.authType === 'apiKey') {
                if (form.apiKeyPlacement === 'header') {
                    headers[form.apiKeyName || 'Authorization'] = form.apiKeyValue || ''
                } else {
                    if (form.apiKeyName && form.apiKeyValue) {
                        url.searchParams.set(form.apiKeyName, form.apiKeyValue)
                    }
                }
            }
            if (form.authType === 'bearer') {
                headers['Authorization'] = `Bearer ${form.bearerToken || ''}`
            }
            if (form.authType === 'basic') {
                const token = btoa(`${form.basicUsername || ''}:${form.basicPassword || ''}`)
                headers['Authorization'] = `Basic ${token}`
            }
            if (form.authType === 'custom') {
                form.headers.forEach((h) => {
                    if (h.key.trim()) headers[h.key.trim()] = h.value
                })
            }
        }
        return { url: url.toString(), headers }
    }
    const preview = buildAuthPreview()

    const loadSources = useCallback(async () => {
        if (loadAbortRef.current) loadAbortRef.current.abort()
        const ac = new AbortController()
        loadAbortRef.current = ac

        setLoading(true)
        const res = await getRemoteSources({ signal: ac.signal })
        setLoading(false)

        if (res.ok) {
            setSources(res.data as unknown as RemoteSource[])
        } else {
            toast.error({ title: '원격 소스 로드 실패', description: res.error, compact: true })
        }
    }, [])

    const loadLinkedIds = useCallback(async () => {
        if (!activeModelId) {
            setLinkedIds([])
            return
        }
        try {
            const { data } = await axios.get(apiModel.sources(activeModelId))
            const onlyRemote = (data?.sources ?? []).filter((s: any) => s.source_type === 'remote')
            setLinkedIds(onlyRemote.map((s: any) => s.source_id as number))
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
        return () => loadAbortRef.current?.abort()
    }, [loadSources])

    useEffect(() => {
        loadLinkedIds()
    }, [loadLinkedIds])

    const onChangeQuery = useCallback((v: string) => {
        setQuery(v)
        if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = window.setTimeout(() => setPage(1), 200)
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return sources.filter((s) => {
            if (q) {
                const hay = `${s.name} ${s.endpoint}`.toLowerCase()
                if (!hay.includes(q)) return false
            }
            if (enabledFilter === 'active' && !s.enabled) return false
            if (enabledFilter === 'inactive' && s.enabled) return false
            if (linkedFilter === 'linked' && !linkedIds.includes(s.id!)) return false
            if (linkedFilter === 'unlinked' && linkedIds.includes(s.id!)) return false
            if (authFilter === 'auth' && !s.auth) return false
            if (authFilter === 'noauth' && s.auth) return false
            return true
        })
    }, [sources, query, enabledFilter, linkedFilter, authFilter, linkedIds])

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const pageData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, currentPage, pageSize])

    useEffect(() => {
        setPage(1)
    }, [enabledFilter, linkedFilter, authFilter])

    const validateForm = useCallback((f: typeof INITIAL_FORM) => {
        const errs: string[] = []
        if (!f.name.trim()) errs.push('이름은 필수입니다.')
        if (!f.endpoint.trim()) errs.push('Endpoint URL은 필수입니다.')
        const urlLike = /^https?:\/\/[\w.-]+/i.test(f.endpoint.trim())
        if (f.endpoint && !urlLike) errs.push('Endpoint URL 형식이 올바르지 않습니다.')
        if (f.auth) {
            switch (f.authType) {
                case 'apiKey':
                    if (!f.apiKeyName.trim() || !f.apiKeyValue.trim()) errs.push('API Key 이름/값을 입력해 주세요.')
                    break
                case 'bearer':
                    if (!f.bearerToken.trim()) errs.push('Bearer Token을 입력해 주세요.')
                    break
                case 'basic':
                    if (!f.basicUsername.trim() || !f.basicPassword.trim()) errs.push('Basic Auth 사용자/비밀번호를 입력해 주세요.')
                    break
                case 'custom':
                    if (f.headers.length > 0 && f.headers.some((h) => !h.key.trim())) errs.push('Custom Header 키를 모두 입력해 주세요.')
                    break
            }
        }
        return errs
    }, [])

    const addSource = useCallback(async () => {
        const errs = validateForm(form)
        if (errs.length) {
            toast.warning({ title: '입력값을 확인하세요', description: errs.join('\n'), duration: 5000 })
            return
        }

        const payload: any = {
            name: form.name,
            endpoint: form.endpoint,
            status: form.status,
            enabled: form.enabled,
            auth: form.auth,
            auth_config: form.auth
                ? {
                    type: form.authType,
                    apiKey:
                        form.authType === 'apiKey'
                            ? {
                                name: form.apiKeyName,
                                value: form.apiKeyValue,
                                placement: form.apiKeyPlacement,
                            } : undefined,
                    bearer:
                        form.authType === 'bearer'
                            ? {
                                token: form.bearerToken,
                            } : undefined,
                    basic:
                        form.authType === 'basic'
                            ? {
                                username: form.basicUsername,
                                password: form.basicPassword,
                            } : undefined,
                    headers: form.authType === 'custom' ? form.headers.filter((h) => h.key.trim()) : undefined,
                }
                : undefined,
        }

        const res = await addRemoteSource(payload as any)
        if (res.ok) {
            await loadSources()
            setShowAddModal(false)
            setForm({ ...INITIAL_FORM })
            toast.success({ title: '등록 완료', description: '원격 소스를 등록했습니다.', compact: true })
        } else {
            toast.error({ title: '등록 실패', description: res.error, compact: true })
        }
    }, [form, validateForm, loadSources])

    const handleDeleteSource = useCallback(
        async (id?: number) => {
            if (!id) {
                toast.error({ title: '소스 ID가 잘못되었습니다.', compact: true })
                return
            }
            const prev = sources
            setSources((s) => s.filter((x) => x.id !== id))
            const res = await deleteRemoteSource(id)
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
            const next: RemoteSource = {
                ...src,
                enabled: !src.enabled,
                status: (!src.enabled ? 'active' : 'inactive') as SourceStatus,
            }

            setSources((list) => list.map((s) => (s.id === id ? next : s)))
            const res = await updateRemoteSource(id, next)
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

            const res = await updateRemoteSource(id, updated)
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

            const updatedRemoteSources = sources
                .filter((src) => nextLinked.includes(src.id!) && src.enabled)
                .map((src) => src.id!)

            const payload = {
                sources: updatedRemoteSources.map((id) => ({
                    source_id: id,
                    source_type: 'remote',
                })),
            }

            try {
                await axios.patch(`${apiModel.sources(activeModelId)}?source_type=remote`, payload)

                const currentParamsRes = await axios.get(apiModel.params(activeModelId))
                const currentParams = currentParamsRes.data || {}

                const newParams = { ...currentParams, remote_sources: updatedRemoteSources }
                await axios.patch(apiModel.params(activeModelId), newParams)

                toast.success({ title: '연결 정보 업데이트', description: 'Remote 연결이 반영되었습니다.', compact: true })
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

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-white/60" />
                    Remote 소스
                    <span className="ml-1 text-[11px] text-white/40">
                        총 {sources.length}개 · 활성화 {sources.filter((s) => s.enabled).length}개
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
                        API 추가
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-md p-2">
                <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        className="w-full pl-7 pr-3 py-1.5 rounded bg-white/10 text-white text-xs placeholder-white/40"
                        placeholder="이름/엔드포인트 검색…"
                        value={query}
                        onChange={(e) => onChangeQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-white/60 flex-wrap">
                    <Filter className="w-4 h-4 hidden sm:block" />
                    <select
                        className="shrink-0 w-[88px] sm:w-[88px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
                        value={authFilter}
                        onChange={(e) => setAuthFilter(e.target.value as AuthFilter)}
                    >
                        <option className="text-black" value="all">인증(전체)</option>
                        <option className="text-black" value="auth">Auth 필요</option>
                        <option className="text-black" value="noauth">Auth 없음</option>
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
                        className="shrink-0 w={[68px]} sm:w-[70px] bg-white/10 text-white text-[11px] rounded px-2 py-1"
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
                            <option key={n} className="text-black" value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {pageData.map((src) => (
                <div key={src.id ?? src.name} className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition">
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
                        <span>{src.endpoint}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {src.status === 'active' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span
                            className={clsx('text-[10px] font-medium', {
                                'text-green-400': src.status === 'active',
                                'text-red-400': src.status === 'inactive',
                            })}
                        >
                            {src.status === 'active' ? 'Active' : 'Inactive'}
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
                        className={clsx(
                            'fixed inset-0 z-[9999] p-4 flex items-center justify-center',
                            'bg-gradient-to-br from-black/60 via-[#0b0b18]/50 to-black/60',
                            'backdrop-blur-md'
                        )}
                        onClick={() => setShowAddModal(false)}
                    >
                        <div className="pointer-events-none absolute inset-0 opacity-40">
                            <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl bg-indigo-500/20" />
                            <div className="absolute -bottom-24 -right-20 w-[28rem] h-[28rem] rounded-full blur-3xl bg-fuchsia-500/15" />
                        </div>

                        <div
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !submitDisabled) addSource()
                                if (e.key === 'Escape') setShowAddModal(false)
                            }}
                            className={clsx(
                                'relative w-full max-w-lg rounded-2xl ring-1 ring-white/10',
                                'bg-gradient-to-b from-[#2c2c3d] to-[#262637] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]',
                                'scrollLLMArea overflow-y-auto overscroll-contain',
                                'h-[82vh] max-h-[82vh]',
                                'p-6 space-y-5'
                            )}
                            role="dialog"
                            aria-modal="true"
                            aria-label="새 Remote API 등록"
                        >
                            <div className="flex justify-between items-center">
                                <h4 className="text-xl font-semibold text-white tracking-wide">
                                    새 Remote API 등록
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
                                    placeholder="예) OpenSearch API"
                                    value={form.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] text-white/60">Endpoint URL</label>
                                    <span
                                        className={
                                            invalidUrl
                                                ? 'text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30'
                                                : 'text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                                        }
                                    >
                                        {invalidUrl ? 'URL 형식 확인 필요' : '유효한 URL'}
                                    </span>
                                </div>
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="https://api.example.com/v1/search"
                                    value={form.endpoint}
                                    onChange={(e) => handleFormChange('endpoint', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">인증 필요 여부</label>
                                    <select
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        value={String(form.auth)}
                                        onChange={(e) => handleFormChange('auth', e.target.value === 'true')}
                                    >
                                        <option className="text-black" value="false">Auth 없음</option>
                                        <option className="text-black" value="true">Auth 필요</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">상태</label>
                                    <select
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        value={form.status}
                                        onChange={(e) => handleFormChange('status', e.target.value as SourceStatus)}
                                    >
                                        <option className="text-black" value="active">Active</option>
                                        <option className="text-black" value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {form.auth && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] text-white/60">인증 타입</label>
                                        <select
                                            className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                            value={form.authType}
                                            onChange={(e) => handleFormChange('authType', e.target.value as AuthType)}
                                        >
                                            <option className="text-black" value="apiKey">API Key</option>
                                            <option className="text-black" value="bearer">Bearer Token</option>
                                            <option className="text-black" value="basic">Basic Auth</option>
                                            <option className="text-black" value="custom">Custom Headers</option>
                                        </select>
                                    </div>

                                    {form.authType === 'apiKey' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] text-white/60">Key 이름</label>
                                                <input
                                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                    placeholder="Authorization or X-API-Key"
                                                    value={form.apiKeyName}
                                                    onChange={(e) => handleFormChange('apiKeyName', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] text-white/60">적용 위치</label>
                                                <select
                                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                    value={form.apiKeyPlacement}
                                                    onChange={(e) =>
                                                        handleFormChange('apiKeyPlacement', e.target.value as ApiKeyPlacement)
                                                    }
                                                >
                                                    <option className="text-black" value="header">Header</option>
                                                    <option className="text-black" value="query">Query String</option>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2 space-y-1.5">
                                                <label className="text-[11px] text-white/60">Key 값</label>
                                                <input
                                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                    placeholder="예) Bearer xxxxx 혹은 실제 API Key"
                                                    value={form.apiKeyValue}
                                                    onChange={(e) => handleFormChange('apiKeyValue', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {form.authType === 'bearer' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] text-white/60">Bearer Token</label>
                                            <input
                                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                                value={form.bearerToken}
                                                onChange={(e) => handleFormChange('bearerToken', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {form.authType === 'basic' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] text-white/60">Username</label>
                                                <input
                                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                    placeholder="user"
                                                    value={form.basicUsername}
                                                    onChange={(e) => handleFormChange('basicUsername', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] text-white/60">Password</label>
                                                <input
                                                    type="password"
                                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                    placeholder="••••••••"
                                                    value={form.basicPassword}
                                                    onChange={(e) => handleFormChange('basicPassword', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {form.authType === 'custom' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[11px] text-white/60">헤더 목록</label>
                                                <button
                                                    onClick={addHeaderRow}
                                                    type="button"
                                                    className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/10 text-white/80 hover:bg-white/15"
                                                >
                                                    + 추가
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {form.headers.length === 0 && (
                                                    <div className="text-[12px] text-white/45">추가된 헤더가 없습니다.</div>
                                                )}
                                                {form.headers.map((h) => (
                                                    <div key={h.id} className="grid grid-cols-12 gap-2">
                                                        <input
                                                            className="col-span-5 rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                            placeholder="Header-Key"
                                                            value={h.key}
                                                            onChange={(e) => updateHeaderRow(h.id, 'key', e.target.value)}
                                                        />
                                                        <input
                                                            className="col-span-6 rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                                            placeholder="Header-Value"
                                                            value={h.value}
                                                            onChange={(e) => updateHeaderRow(h.id, 'value', e.target.value)}
                                                        />
                                                        <button
                                                            onClick={() => removeHeaderRow(h.id)}
                                                            className="col-span-1 text-white/60 hover:text-rose-300 text-sm"
                                                            type="button"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <label className="inline-flex items-center gap-2 select-none">
                                <input
                                    type="checkbox"
                                    checked={form.enabled}
                                    onChange={(e) => handleFormChange('enabled', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-white text-sm">Enabled</span>
                            </label>

                            <div className="mt-1 rounded-lg bg-white/[.06] ring-1 ring-white/10 p-3">
                                <div className="text-[11px] text-white/60 mb-1">요청 프리뷰</div>
                                <pre className="text-[11px] text-white/85 whitespace-pre-wrap">
                                    {`GET ${preview.url}
                                        ${Object.keys(preview.headers).length ? 'Headers:' : ''}`}{Object.entries(preview.headers).map(([k, v]) => `\n${k}: ${v}`).join('')}
                                </pre>
                            </div>

                            {submitDisabled && (
                                <div className="rounded-md bg-rose-500/10 ring-1 ring-rose-400/30 p-3 text-[12px] text-rose-200 space-y-1">
                                    {!form?.name?.trim() && <div>· 이름을 입력해 주세요.</div>}
                                    {invalidUrl && <div>· Endpoint URL 형식을 확인해 주세요.</div>}
                                    {authMissing && <div>· 선택한 인증 타입의 필수 항목을 채워주세요.</div>}
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
