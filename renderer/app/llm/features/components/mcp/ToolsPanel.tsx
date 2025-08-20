// app/llm/features/components/mcp/ToolsPanel.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    Wrench,
    Trash2,
    Play,
    Plus,
    ToggleLeft,
    ToggleRight,
    CheckCircle,
    XCircle,
    Link2,
    Link2Off,
    Pencil,
    RefreshCw,
    Search,
    Save,
} from 'lucide-react'
import clsx from 'clsx'

import { fetchTools, createTool, updateTool, deleteTool } from '@/app/llm/services/toolsAPI'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { toast } from '@/app/common/toast/useToastStore'
import { mcpHttp } from '@/app/lib/api/mcp'
import ToolEditorModal, { Tool } from './ToolEditorModal'

type LinkedFilter = 'all' | 'linked' | 'unlinked'
type EnabledFilter = 'all' | 'on' | 'off'

export default function ToolsPanel() {
    const activeModelId = useMCPStore((s) => s.activeModelId)
    const configMap = useMCPStore((s) => s.configMap)
    const updateConfig = useMCPStore((s) => s.updateConfig)
    const linkedToolIds = activeModelId ? configMap[activeModelId]?.linkedToolIds ?? [] : []

    const [tools, setTools] = useState<Tool[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [query, setQuery] = useState('')
    const [filterLinked, setFilterLinked] = useState<LinkedFilter>('all')
    const [filterEnabled, setFilterEnabled] = useState<EnabledFilter>('all')

    const [editorOpen, setEditorOpen] = useState(false)
    const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
    const [editingTool, setEditingTool] = useState<Tool | undefined>(undefined)

    const loadTools = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            setRefreshing(silent)
            const data = await fetchTools()
            setTools(Array.isArray(data) ? data : [])
        } catch {
            toast.error({ title: '로드 실패', description: '도구 목록을 불러오지 못했습니다.', compact: true })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    const loadLinked = useCallback(async () => {
        if (!activeModelId) return
        try {
            const { data } = await mcpHttp.get(`/llm/model/${encodeURIComponent(activeModelId)}/tools`)
            const ids: number[] = Array.isArray(data) ? data.map((t: any) => t.tool_id) : []
            updateConfig(activeModelId, { linkedToolIds: ids })
        } catch {
            toast.error({ description: '연동된 도구를 불러오지 못했습니다.', compact: true })
        }
    }, [activeModelId, updateConfig])

    useEffect(() => {
        loadTools(false)
    }, [loadTools])

    useEffect(() => {
        loadLinked()
    }, [loadLinked])

    const handleToggleLink = useCallback(async (toolId: number) => {
        if (!activeModelId) {
            toast.info({ description: '먼저 모델을 선택해 주세요.', compact: true })
            return
        }
        const current = linkedToolIds
        const next = current.includes(toolId) ? current.filter((id) => id !== toolId) : [...current, toolId]
        updateConfig(activeModelId, { linkedToolIds: next })

        try {
            await mcpHttp.patch(`/llm/model/${encodeURIComponent(activeModelId)}/tools`, { tool_ids: next })
            const { data: params } = await mcpHttp.get(`/llm/model/${encodeURIComponent(activeModelId)}/params`)
            await mcpHttp.patch(`/llm/model/${encodeURIComponent(activeModelId)}/params`, {
                ...params,
                tools: next,
            })
            toast.success({ description: '도구 연동이 업데이트되었습니다.', compact: true })
        } catch {
            updateConfig(activeModelId, { linkedToolIds: current })
            toast.error({ description: '연동 업데이트 실패', compact: true })
        }
    }, [activeModelId, linkedToolIds, updateConfig])

    const toggleEnabled = useCallback(async (tool: Tool) => {
        if (!tool.id) return
        const prev = { ...tool }
        const next = { ...tool, enabled: !tool.enabled }
        setTools((list) => list.map((t) => (t.id === tool.id ? next : t)))
        try {
            const req = updateTool(tool.id, next)
            await toast.promise(req as unknown as Promise<any>, {
                loading: { description: '상태 변경 중…', compact: true },
                success: { description: `도구 ${next.enabled ? '활성화' : '비활성화'}됨`, compact: true },
                error: { description: '상태 변경 실패', compact: true },
            })
        } catch {
            setTools((list) => list.map((t) => (t.id === prev.id ? prev : t)))
        }
    }, [])

    const confirmDelete = useCallback((id: number, name: string) => {
        const tid = toast.show({
            variant: 'warning',
            title: '도구 삭제',
            description: `"${name}"을(를) 삭제할까요?`,
            actionText: '삭제',
            onAction: async () => {
                toast.dismiss(tid)
                try {
                    await toast.promise(deleteTool(id) as unknown as Promise<any>, {
                        loading: { description: '삭제 중…', compact: true },
                        success: { description: '삭제 완료', compact: true },
                        error: { description: '삭제 실패', compact: true },
                    })
                    setTools((prev) => prev.filter((t) => t.id !== id))
                } catch {}
            },
            duration: 8000,
        })
    }, [])

    // REST::JSON 파서
    function parseRestCommandString(cmd: string): null | { method: string; url: string; headers?: any; body?: any; timeout?: number } {
        if (!cmd.startsWith('REST::')) return null
        try {
            const json = JSON.parse(cmd.slice(6))
            return {
                method: (json.method || 'GET').toUpperCase(),
                url: json.url,
                headers: json.headers,
                body: json.body,
                timeout: json.timeout,
            }
        } catch {
            return null
        }
    }

    const executeTool = useCallback(async (tool: Tool) => {
        if (!tool.enabled) {
            toast.info({ description: '도구가 비활성화되어 있습니다.', compact: true })
            return
        }
        try {
            let req: Promise<any>
            if (tool.type === 'python') {
                req = mcpHttp.get('/api/tools/python', { params: { command: tool.command } })
            } else if (tool.type === 'rest') {
                const parsed = parseRestCommandString(tool.command)
                if (parsed) {
                    const cfg: any = {
                        headers: parsed.headers,
                        timeout: parsed.timeout,
                    }
                    const m = parsed.method
                    if (m === 'GET' || m === 'DELETE') {
                        req = mcpHttp.request({ url: parsed.url, method: m as any, ...cfg })
                    } else {
                        req = mcpHttp.request({ url: parsed.url, method: m as any, data: parsed.body, ...cfg })
                    }
                } else {
                    // 구버전: command 에 URL만 들어있음 → GET
                    req = mcpHttp.get(tool.command)
                }
            } else if (tool.type === 'powershell') {
                req = mcpHttp.get('/api/tools/powershell', { params: { command: tool.command } })
            } else {
                toast.info({ description: `알 수 없는 타입: ${tool.type}`, compact: true })
                return
            }

            const { data } = await toast.promise(req, {
                loading: { description: '도구 실행 중…', compact: true },
                success: { description: '도구 실행 완료', compact: true },
                error: { description: '도구 실행 실패', compact: true },
            })
            console.log('Tool result:', data)
        } catch {}
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return tools
            .filter((t) => {
                if (q) {
                    const hit = `${t.name} ${t.command} ${t.type}`.toLowerCase().includes(q)
                    if (!hit) return false
                }
                if (filterLinked !== 'all') {
                    const linked = t.id !== undefined && linkedToolIds.includes(t.id)
                    if (filterLinked === 'linked' && !linked) return false
                    if (filterLinked === 'unlinked' && linked) return false
                }
                if (filterEnabled !== 'all') {
                    if (filterEnabled === 'on' && !t.enabled) return false
                    if (filterEnabled === 'off' && t.enabled) return false
                }
                return true
            })
            .sort((a, b) => {
                const al = a.id !== undefined && linkedToolIds.includes(a.id) ? 1 : 0
                const bl = b.id !== undefined && linkedToolIds.includes(b.id) ? 1 : 0
                if (al !== bl) return bl - al
                if (a.enabled !== b.enabled) return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0)
                return a.name.localeCompare(b.name)
            })
    }, [tools, query, filterLinked, filterEnabled, linkedToolIds])

    useEffect(() => {
        if (!editorOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditorOpen(false) }
        window.addEventListener('keydown', onKey)
        return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
    }, [editorOpen])

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 min-w-0 py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="flex items-center gap-1 text-[12px] md:text-sm leading-5 font-semibold text-white/85 whitespace-nowrap">
                        <Wrench className="w-4 h-4 text-white/60" />
                        <span className="truncate max-w-[28ch] md:max-w-[40ch]">툴 목록</span>
                    </h3>
                    <span className="hidden sm:inline text-[11px] leading-5 text-white/50 whitespace-nowrap">
                        총 {tools.length}개 · 연결 {linkedToolIds.length}개
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => loadTools(true)}
                        disabled={refreshing}
                        title="새로고침"
                        className={clsx(
                            'inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] leading-5',
                            'text-white/70 hover:text-white transition whitespace-nowrap',
                            refreshing && 'opacity-60 cursor-not-allowed'
                        )}
                    >
                        <RefreshCw className={clsx('w-3.5 h-3.5', refreshing && 'animate-spin')} />
                        <span className="hidden sm:inline">새로고침</span>
                    </button>
                    <button
                        onClick={() => { setEditorMode('add'); setEditingTool(undefined); setEditorOpen(true) }}
                        title="툴 추가"
                        className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] leading-5 text-indigo-300 hover:text-indigo-200 transition whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">툴 추가</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="mt-2 flex items-center gap-2 w-full sm:w-auto min-w-[220px]">
                    <div className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 ring-1 ring-white/10 w-full">
                        <Search className="w-3.5 h-3.5 text-white/60 shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="검색(이름/커맨드/타입)…"
                            className="bg-transparent text-xs leading-5 text-white/90 outline-none placeholder:text-white/40 w-full"
                        />
                    </div>
                </div>

                <div className="hide-scrollbar -mx-1 overflow-x-auto overflow-y-hidden">
                    <div className="px-1 mt-2 flex items-center gap-[3px] whitespace-nowrap">
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

                        {/* <span className="inline-block w-px h-3 bg-white/10 mx-1" /> */}

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
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
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
                    {filtered.map((tool) => {
                        const linked = tool.id !== undefined && linkedToolIds.includes(tool.id)
                        return (
                            <div
                                key={tool.id ?? tool.name}
                                className="relative p-3 rounded-xl ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition overflow-hidden"
                            >
                                <div
                                    className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition duration-500"
                                    style={{
                                        background:
                                            'radial-gradient(1200px 200px at 10% -10%, rgba(99,102,241,0.18), transparent 40%), radial-gradient(800px 160px at 110% 120%, rgba(20,184,166,0.16), transparent 40%)'
                                    }}
                                />
                                <div className="flex justify-between items-start gap-2 relative">
                                    <div className="flex items-start gap-2 min-w-0">
                                        <Wrench className="w-4 h-4 text-white/60 mt-[2px]" />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-[12px] font-semibold truncate">{tool.name}</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] border bg-white/10 text-white/70 border-white/15">
                                                    {tool.type}
                                                </span>
                                                <span
                                                    className={clsx(
                                                        'px-2 py-0.5 rounded-full text-[10px] border',
                                                        tool.enabled
                                                            ? 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30'
                                                            : 'bg-white/10 text-white/70 border-white/15'
                                                    )}
                                                >
                                                    {tool.enabled ? '사용중' : '꺼짐'}
                                                </span>
                                            </div>
                                            <div className="text-white/55 text-[10px] mt-0.5 break-all flex items-center gap-1">
                                                <Link2 className="w-3.5 h-3.5" />
                                                <span>{tool.command}</span>
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
                                            onClick={() => tool.id && handleToggleLink(tool.id)}
                                            title={linked ? '연결 해제' : '연결'}
                                        >
                                            {linked ? '연결됨' : '미연결'}
                                        </button>
                                        <button
                                            className="text-white/60 hover:text-white rounded p-1"
                                            onClick={() => executeTool(tool)}
                                            title="실행"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="text-white/60 hover:text-white rounded p-1"
                                            onClick={() => { setEditorMode('edit'); setEditingTool(tool); setEditorOpen(true) }}
                                            title="편집"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="text-white/60 hover:text-white rounded p-1"
                                            onClick={() => toggleEnabled(tool)}
                                            title={tool.enabled ? '비활성화' : '활성화'}
                                        >
                                            {tool.enabled
                                                ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                                                : <ToggleLeft className="w-5 h-5 text-white/50" />
                                            }
                                        </button>
                                        <button
                                            className="text-white/60 hover:text-rose-400 rounded p-1"
                                            onClick={() => tool.id && confirmDelete(tool.id, tool.name)}
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    {tool.enabled
                                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        : <XCircle className="w-4 h-4 text-rose-400" />
                                    }
                                    <span
                                        className={clsx(
                                            'text-[10px] font-medium',
                                            tool.enabled ? 'text-emerald-300' : 'text-rose-300'
                                        )}
                                    >
                                        {tool.enabled ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {editorOpen && (
                <ToolEditorModal
                    open={editorOpen}
                    mode={editorMode}
                    initial={editingTool}
                    onClose={() => setEditorOpen(false)}
                    onTest={async (draft) => {
                        // 모달 안 “테스트 실행”
                        const fake: Tool = { ...draft, id: draft.id ?? -1 }
                        // ToolsPanel의 실행 로직 재사용
                        await (async () => {
                            if (!fake.enabled) fake.enabled = true
                            await executeTool(fake)
                        })()
                    }}
                    onSubmit={async (draft) => {
                        if (editorMode === 'add') {
                            const req = createTool(draft)
                            const data = await toast.promise(req as unknown as Promise<Tool>, {
                                loading: { description: '도구 등록 중…', compact: true },
                                success: { description: '도구가 추가되었습니다.', compact: true },
                                error: { description: '도구 등록 실패', compact: true },
                            })
                            setTools((prev) => [...prev, data])
                        } else if (editorMode === 'edit' && draft.id != null) {
                            const req = updateTool(draft.id, draft)
                            const data = await toast.promise(req as unknown as Promise<Tool>, {
                                loading: { description: '수정 중…', compact: true },
                                success: { description: '도구가 수정되었습니다.', compact: true },
                                error: { description: '도구 수정 실패', compact: true },
                            })
                            setTools((prev) => prev.map((t) => (t.id === data.id ? data : t)))
                        }
                        setEditorOpen(false)
                    }}
                />
            )}

            <style jsx>{`
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    )
}