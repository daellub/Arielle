'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    FileText,
    Copy as DuplicateIcon,
    Trash2,
    Plus,
    Save,
    X,
    Pencil,
    RefreshCw,
    Link2,
    Link2Off,
    Check,
    ToggleLeft,
    ToggleRight,
    Search
} from 'lucide-react'
import clsx from 'clsx'

import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { toast } from '@/app/common/toast/useToastStore'
import { mcpHttp } from '@/app/lib/api/mcp'

interface PromptEntry {
    id?: number
    name: string
    preview: string
    full: string
    variables: string[]
    enabled: boolean
}

export default function PromptsPanel() {
    const activeModelId = useMCPStore(s => s.activeModelId)

    const [prompts, setPrompts] = useState<PromptEntry[]>([])
    const [linkedIds, setLinkedIds] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

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

    const [query, setQuery] = useState('')
    const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all')
    const [filterEnabled, setFilterEnabled] = useState<'all' | 'on' | 'off'>('all')

    const abortPrompts = useRef<AbortController | null>(null)
    const abortLinked = useRef<AbortController | null>(null)

    const normalizePrompt = (p: any): PromptEntry => ({
        id: p.id,
        name: p.name ?? '',
        preview: p.preview ?? (p.full ?? p.template ?? '').slice(0, 120),
        full: p.full ?? p.template ?? '',
        variables: Array.isArray(p.variables) ? p.variables : [],
        enabled: Boolean(p.enabled ?? true),
    })

    const generatePreview = (fullText: string) =>
        (fullText || '').replace(/\s+/g, ' ').trim().slice(0, 120)

    const handleFormChange = (key: keyof PromptEntry, value: any) => {
        if (key === 'full') {
            const pv = generatePreview(value)
            setForm(prev => ({ ...prev, full: value, preview: pv }))
        } else if (key === 'variables') {
            const arr = Array.isArray(value) ? value : String(value || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            setForm(prev => ({ ...prev, variables: arr }))
        } else {
            setForm(prev => ({ ...prev, [key]: value }))
        }
    }

    const handleEditFormChange = (key: keyof PromptEntry, value: any) => {
        setEditPrompt(prev => {
            if (!prev) return prev
            if (key === 'full') {
                return { ...prev, full: value, preview: generatePreview(value) }
            }
            if (key === 'variables') {
                const arr = Array.isArray(value) ? value : String(value || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
                return { ...prev, variables: arr }
            }
            return { ...prev, [key]: value }
        })
    }

    const loadPrompts = useCallback(async (silent = false) => {
        try {
            abortPrompts.current?.abort()
            const ac = new AbortController()
            abortPrompts.current = ac

            if (!silent) setLoading(true)
            setRefreshing(silent)

            const { data } = await mcpHttp.get('/api/prompts', { signal: ac.signal as any })
            const list = Array.isArray(data) ? data : []
            setPrompts(list.map(normalizePrompt))
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                toast.error({ title: '로드 실패', description: '프롬프트 목록을 불러오지 못했습니다.', compact: true })
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    const loadLinked = useCallback(async () => {
        if (!activeModelId) {
            setLinkedIds([])
            return
        }
        try {
            abortLinked.current?.abort()
            const ac = new AbortController()
            abortLinked.current = ac

            const { data } = await mcpHttp.get(`/llm/model/${encodeURIComponent(activeModelId)}/prompts`, {
                signal: ac.signal as any
            })
            const ids = Array.isArray(data?.prompt_ids) ? data.prompt_ids : []
            setLinkedIds(ids)
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                toast.error({ description: '연동된 프롬프트를 불러오지 못했습니다.', compact: true })
            }
        }
    }, [activeModelId])

    useEffect(() => {
        loadPrompts(false)
        return () => { try { abortPrompts.current?.abort() } catch {} }
    }, [loadPrompts])

    useEffect(() => {
        loadLinked()
        return () => { try { abortLinked.current?.abort() } catch {} }
    }, [loadLinked])

    const addPrompt = useCallback(async () => {
        if (!form.name || !form.full) {
            toast.info({ description: '이름과 템플릿 내용을 입력해 주세요.', compact: true })
            return
        }
        const payload = {
            name: form.name,
            template: form.full,
            variables: form.variables,
            enabled: form.enabled,
            preview: form.preview,
        }
        try {
            const p = mcpHttp.post('/api/prompts', payload)
            const { data } = await toast.promise(p, {
                loading: { description: '프롬프트 등록 중…', compact: true },
                success: { description: '프롬프트가 추가되었습니다.', compact: true },
                error:   { description: '프롬프트 등록 실패', compact: true },
            })
            setPrompts(prev => [...prev, normalizePrompt(data)])
            setShowAddModal(false)
            setForm({ name: '', preview: '', full: '', variables: [], enabled: true })
        } catch {}
    }, [form])

    const updatePrompt = useCallback(async () => {
        if (!editPrompt?.id) return
        const payload = {
            name: editPrompt.name,
            template: editPrompt.full,
            variables: editPrompt.variables,
            enabled: editPrompt.enabled,
            preview: editPrompt.preview,
        }
        try {
            const p = mcpHttp.patch(`/api/prompts/${editPrompt.id}`, payload)
            const { data } = await toast.promise(p, {
                loading: { description: '수정 중…', compact: true },
                success: { description: '프롬프트가 수정되었습니다.', compact: true },
                error:   { description: '프롬프트 수정 실패', compact: true },
            })
            setPrompts(prev => prev.map(x => x.id === editPrompt.id ? normalizePrompt(data) : x))
            setShowEditModal(false)
            setEditPrompt(null)
        } catch {}
    }, [editPrompt])

    const confirmDelete = useCallback((promptId: number, name: string) => {
        const id = toast.show({
            variant: 'warning',
            title: '프롬프트 삭제',
            description: `"${name}"을(를) 삭제할까요?`,
            actionText: '삭제',
            onAction: async () => {
                toast.dismiss(id)
                try {
                    await toast.promise(
                        mcpHttp.delete(`/api/prompts/${promptId}`),
                        {
                            loading: { description: '삭제 중…', compact: true },
                            success: { description: '삭제 완료', compact: true },
                            error:   { description: '삭제 실패', compact: true },
                        }
                    )
                    setPrompts(prev => prev.filter(p => p.id !== promptId))
                } catch {}
            },
            duration: 8000,
        })
    }, [])

    const duplicatePrompt = useCallback(async (p: PromptEntry) => {
        const payload = {
            name: `${p.name} (복사)`,
            template: p.full,
            variables: p.variables,
            enabled: p.enabled,
            preview: generatePreview(p.full),
        }
        try {
            const req = mcpHttp.post('/api/prompts', payload)
            const { data } = await toast.promise(req, {
                loading: { description: '복사본 생성 중…', compact: true },
                success: { description: '복사본이 생성되었습니다.', compact: true },
                error:   { description: '복사 실패', compact: true },
            })
            setPrompts(prev => [...prev, normalizePrompt(data)])
        } catch {}
    }, [])

    const handleToggleLink = useCallback(async (promptId: number) => {
        if (!activeModelId) {
            toast.info({ description: '먼저 모델을 선택해 주세요.', compact: true })
            return
        }
        const wasLinked = linkedIds.includes(promptId)
        const next = wasLinked ? linkedIds.filter(id => id !== promptId) : [...linkedIds, promptId]
        setLinkedIds(next)

        try {
            await mcpHttp.patch(`/llm/model/${encodeURIComponent(activeModelId)}/prompts`, { prompt_ids: next })
            const { data: params } = await mcpHttp.get(`/llm/model/${encodeURIComponent(activeModelId)}/params`)
            await mcpHttp.patch(`/llm/model/${encodeURIComponent(activeModelId)}/params`, {
                ...params,
                prompts: next
            })
            toast.success({ description: '프롬프트 연동이 업데이트되었습니다.', compact: true })
        } catch (e) {
            setLinkedIds(linkedIds)
            toast.error({ description: '연동 업데이트 실패', compact: true })
        }
    }, [activeModelId, linkedIds])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        const list = prompts.filter(p => {
            if (q) {
                const inText = `${p.name} ${p.full}`.toLowerCase().includes(q)
                if (!inText) return false
            }
            if (filterLinked !== 'all') {
                const isLinked = p.id !== undefined && linkedIds.includes(p.id)
                if (filterLinked === 'linked' && !isLinked) return false
                if (filterLinked === 'unlinked' && isLinked) return false
            }
            if (filterEnabled !== 'all') {
                if (filterEnabled === 'on' && !p.enabled) return false
                if (filterEnabled === 'off' && p.enabled) return false
            }
            return true
        })

        return list.sort((a, b) => {
            const al = a.id !== undefined && linkedIds.includes(a.id) ? 1 : 0
            const bl = b.id !== undefined && linkedIds.includes(b.id) ? 1 : 0
            if (al !== bl) return bl - al
            if (a.enabled !== b.enabled) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0)
            return a.name.localeCompare(b.name)
        })
    }, [prompts, query, filterLinked, filterEnabled, linkedIds])

    useEffect(() => {
        if (!showAddModal && !showEditModal && !selectedPrompt) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowAddModal(false)
                setShowEditModal(false)
                setSelectedPrompt(null)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [showAddModal, showEditModal, selectedPrompt])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 min-w-0 py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="flex items-center gap-1 text-[12px] md:text-sm font-semibold text-white/85 whitespace-nowrap">
                        <FileText className="w-4 h-4 text-white/60" />
                        <span className="truncate max-w-[28ch] md:max-w-[40ch]">프롬프트 템플릿</span>
                    </h3>
                    
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => loadPrompts(true)}
                        className={clsx(
                            'inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] leading-5',
                            'text-white/70 hover:text-white transition whitespace-nowrap',
                            refreshing && 'opacity-60 cursor-not-allowed'
                        )}
                        title="새로고침"
                        disabled={refreshing}
                    >
                        <RefreshCw className={clsx('w-3.5 h-3.5', refreshing && 'animate-spin')} />
                        <span className="hidden sm:inline">새로고침</span>
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        title="템플릿 추가"
                        className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] leading-5 text-indigo-300 hover:text-indigo-200 transition whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">템플릿 추가</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="mt-2 flex items-center gap-6">
                    <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 ring-1 ring-white/10 w-full">
                        <Search className="w-3.5 h-3.5 text-white/60 shrink-0" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="검색(이름/내용)…"
                            className="bg-transparent text-xs leading-5 text-white/90 outline-none placeholder:text-white/40 w-full"
                        />
                    </div>
                    <span className="hidden sm:inline text-[11px] leading-5 text-white/50 whitespace-nowrap">
                        총 {prompts.length}개 · 연결 {linkedIds.length}개
                    </span>
                </div>

                <div className="hide-scrollbar -mx-1 overflow-x-auto overflow-y-hidden">
                    <div className="px-1 mt-2 flex items-center gap-[3px] whitespace-nowrap">
                        {/* <div className='flex'> */}
                            <button
                                className={clsx('px-2 py-0.5 rounded-full border text-[10px] transition',
                                    filterLinked === 'all' ? 'bg-white/10 text-white/80 border-white/15' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
                                onClick={() => setFilterLinked('all')}
                            >
                                전체
                            </button>
                            <button
                                className={clsx('px-2 py-0.5 rounded-full border text-[10px] transition',
                                    filterLinked === 'linked' ? 'bg-indigo-500/80 text-white border-indigo-400' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
                                onClick={() => setFilterLinked('linked')}
                            >
                                <Link2 className="inline w-3 h-3 mr-1" />
                                연결
                            </button>
                            <button
                                className={clsx('px-2 py-0.5 rounded-full border text-[10px] transition',
                                    filterLinked === 'unlinked' ? 'bg-white/10 text-white/85 border-white/15' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
                                onClick={() => setFilterLinked('unlinked')}
                            >
                                <Link2Off className="inline w-3 h-3 mr-1" />
                                미연결
                            </button>
                        {/* </div> */}

                        {/* <span className="inline-block w-px h-3 bg-white/10 mx-1" /> */}

                        {/* <div className='flex'> */}
                            <button
                                className={clsx('px-2 py-0.5 rounded-full border text-[10px] transition',
                                    filterEnabled === 'all' ? 'bg-white/10 text-white/80 border-white/15' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
                                onClick={() => setFilterEnabled('all')}
                            >
                                전체
                            </button>
                            <button
                                className={clsx('px-2 py-0.5 rounded-full border text-[10px] transition',
                                    filterEnabled === 'on' ? 'bg-emerald-500/80 text-white border-emerald-400' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
                                onClick={() => setFilterEnabled('on')}
                            >
                                <ToggleRight className="inline w-3 h-3 mr-1" />
                                사용중
                            </button>
                            <button
                                className={clsx('px-2 py-0.5 rounded-full border text-[10px] transition',
                                    filterEnabled === 'off' ? 'bg-white/10 text-white/85 border-white/15' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10')}
                                onClick={() => setFilterEnabled('off')}
                            >
                                <ToggleLeft className="inline w-3 h-3 mr-1" />
                                꺼짐
                            </button>
                        {/* </div> */}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[0,1,2].map(i => (
                            <div key={i} className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5">
                                <div className="animate-pulse space-y-2">
                                    <div className="h-3 w-40 bg-white/10 rounded" />
                                    <div className="h-2 w-3/4 bg-white/10 rounded" />
                                    <div className="h-2 w-1/2 bg-white/10 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((p) => {
                            const linked = p.id !== undefined && linkedIds.includes(p.id)
                            return (
                                <div
                                    key={p.id ?? p.name}
                                    className="relative p-3 rounded-xl ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition cursor-pointer overflow-hidden"
                                    onClick={() => setSelectedPrompt(p)}
                                >
                                    <div className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition duration-500"
                                        style={{ background:
                                            'radial-gradient(1200px 200px at 10% -10%, rgba(99,102,241,0.18), transparent 40%), radial-gradient(800px 160px at 110% 120%, rgba(20,184,166,0.16), transparent 40%)'
                                        }}
                                    />
                                    <div className="flex justify-between items-start gap-2 relative">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-white/60 mt-[2px]" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white text-[12px] font-semibold truncate">{p.name}</span>
                                                    <span className={clsx(
                                                        'px-2 py-0.5 rounded-full text-[10px] border',
                                                        p.enabled
                                                            ? 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30'
                                                            : 'bg-white/10 text-white/70 border-white/15'
                                                    )}>
                                                        {p.enabled ? '사용중' : '꺼짐'}
                                                    </span>
                                                    {p.variables?.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] border bg-white/10 text-white/80 border-white/10">
                                                            vars: {p.variables.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-white/55 text-[10px] mt-0.5 line-clamp-2">
                                                    {generatePreview(p.full)}…
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                className={clsx(
                                                    'px-2 py-0.5 rounded-full text-[10px] border transition',
                                                    linked
                                                    ? 'bg-indigo-500 text-white border-indigo-400'
                                                    : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                                                )}
                                                onClick={(e) => { e.stopPropagation(); p.id && handleToggleLink(p.id) }}
                                                title={linked ? '연결 해제' : '연결'}
                                            >
                                                {linked ? '연결됨' : '미연결'}
                                            </button>
                                            <button
                                                className="text-white/60 hover:text-white rounded p-1"
                                                onClick={(e) => { e.stopPropagation(); setEditPrompt(p); setShowEditModal(true) }}
                                                title="편집"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-white/60 hover:text-white rounded p-1"
                                                onClick={(e) => { e.stopPropagation(); duplicatePrompt(p) }}
                                                title="복사본 생성"
                                            >
                                                <DuplicateIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-white/60 hover:text-rose-400 rounded p-1"
                                                onClick={(e) => { e.stopPropagation(); p.id && confirmDelete(p.id, p.name) }}
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {showAddModal && createPortal(
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
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addPrompt()
                            if (e.key === 'Escape') setShowAddModal(false)
                        }}
                        className={clsx(
                            'relative w-full max-w-lg rounded-2xl ring-1 ring-white/10',
                            'bg-gradient-to-b from-[#2c2c3d] to-[#262637] p-6 space-y-5',
                            'shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]'
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-semibold text-white tracking-wide">
                                새 템플릿 등록
                            </h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/60 hover:text-white rounded-md p-1 transition"
                                aria-label="닫기"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">이름</label>
                            <input
                                className={clsx(
                                    'w-full rounded-md bg-white/10 text-white text-sm px-3 py-2',
                                    'focus:outline-none focus:ring-2 focus:ring-indigo-400/40',
                                    'placeholder:text-white/35'
                                )}
                                placeholder="예) 요약 프롬프트, 컨텍스트 전처리"
                                value={form.name}
                                onChange={(e) => handleFormChange('name', e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">전체 템플릿 내용</label>
                            <div className="relative">
                                <textarea
                                    className={clsx(
                                        'w-full h-40 rounded-md bg-white/10 text-white text-sm px-3 py-2',
                                        'focus:outline-none focus:ring-2 focus:ring-indigo-400/40',
                                        'placeholder:text-white/35 resize-none'
                                    )}
                                    placeholder={`AI가 이곳에 적힌 내용을 바탕으로 응답을 생성합니다!\n{{variable}}을 사용하여 변수를 추가할 수 있습니다!`}
                                    value={form.full}
                                    onChange={(e) => handleFormChange('full', e.target.value)}
                                />
                                <span className="absolute bottom-2 right-2 text-[10px] text-white/40 select-none">
                                    {form.full?.length ?? 0} chars
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">변수 (콤마로 구분)</label>
                            <input
                                className={clsx(
                                    'w-full rounded-md bg-white/10 text-white text-sm px-3 py-2',
                                    'focus:outline-none focus:ring-2 focus:ring-indigo-400/40',
                                    'placeholder:text-white/35'
                                )}
                                placeholder="name, language, tone"
                                value={form.variables.join(',')}
                                onChange={(e) => handleFormChange('variables', e.target.value)}
                            />
                            {form.variables.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {form.variables.map((v, i) => (
                                        <span
                                            key={`${v}-${i}`}
                                            className={clsx(
                                                'px-2 py-0.5 rounded-full text-[11px]',
                                                'bg-white/10 text-white/85 ring-1 ring-white/10'
                                            )}
                                        >
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            )}
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

                        {(!form.name.trim() || !form.full.trim()) && (
                            <div className="rounded-md bg-rose-500/10 ring-1 ring-rose-400/30 p-3 text-[12px] text-rose-200 space-y-1">
                                {!form.name.trim() && <div>· 이름을 입력해 주세요.</div>}
                                {!form.full.trim() && <div>· 프롬프트를 입력해 주세요.</div>}
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
                                취소
                            </button>
                            <button
                                onClick={addPrompt}
                                disabled={!form.name.trim() || !form.full.trim()}
                                className={clsx(
                                    'text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition',
                                    !form.name.trim() || !form.full.trim()
                                        ? 'opacity-60 cursor-not-allowed bg-white/10 text-white/60 ring-1 ring-white/10'
                                        : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white ring-1 ring-indigo-300/40 hover:from-indigo-400 hover:to-fuchsia-400 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]'
                                )}
                            >
                                <Save className="w-4 h-4" />
                                등록
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {selectedPrompt && createPortal(
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
                    onClick={() => setSelectedPrompt(null)}
                >
                    <div
                        className="bg-gradient-to-b from-[#2c2c3d] to-[#262637] rounded-xl p-6 space-y-4 w-full max-w-lg max-h-[90vh] overflow-auto ring-1 ring-white/10 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-white/60 hover:text-white"
                            onClick={() => setSelectedPrompt(null)}
                            aria-label="닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-lg font-semibold text-white">{selectedPrompt.name}</div>
                        <pre className="whitespace-pre-wrap text-white/80 text-sm">{selectedPrompt.full}</pre>
                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-white/70">
                            <span>변수:</span>
                            {selectedPrompt.variables.map((v, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded-full border bg-white/10 text-white/85 border-white/10">{v}</span>
                            ))}
                            {selectedPrompt.variables.length === 0 && (
                                <span className="px-1.5 py-0.5 rounded-full border bg-white/10 text-white/60 border-white/10">없음</span>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setSelectedPrompt(null)} className="text-xs text-white/60 hover:text-white">닫기</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showEditModal && editPrompt && createPortal(
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={() => setShowEditModal(false)}
                >
                    <div
                        className="bg-gradient-to-b from-[#2c2c3d] to-[#262637] rounded-xl p-6 space-y-4 w-full max-w-md max-h-[90vh] overflow-auto ring-1 ring-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-white/60" />
                                프롬프트 수정
                            </h4>
                            <button onClick={() => setShowEditModal(false)} className="text-white/60 hover:text-white" aria-label="닫기">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            placeholder="이름"
                            value={editPrompt.name}
                            onChange={e => handleEditFormChange('name', e.target.value)}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') updatePrompt() }}
                        />
                        <textarea
                            className="w-full p-2 rounded bg-white/10 text-white text-sm h-36 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            placeholder="전체 템플릿 내용"
                            value={editPrompt.full}
                            onChange={e => handleEditFormChange('full', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            placeholder="변수 (콤마로 구분)"
                            value={editPrompt.variables.join(',')}
                            onChange={e => handleEditFormChange('variables', e.target.value)}
                        />

                        <label className="flex items-center gap-2 select-none">
                            <input
                                type="checkbox"
                                checked={editPrompt.enabled}
                                onChange={e => handleEditFormChange('enabled', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-white text-sm">Enabled</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowEditModal(false)} className="text-xs text-white/60 hover:text-white">취소</button>
                            <button onClick={updatePrompt} className="text-xs text-indigo-200 hover:text-indigo-100 flex items-center gap-1">
                                <Save className="w-4 h-4" /> 수정 완료
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style jsx>{`
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}