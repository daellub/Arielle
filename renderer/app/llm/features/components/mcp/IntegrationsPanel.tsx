// app/llm/features/components/mcp/IntegrationsPanel.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import {
    Microchip,
    Server as ServerIcon,
    Link2,
    Plus,
    RefreshCw,
    Trash2,
    Wifi,
    WifiOff,
    ShieldCheck,
    Clock,
    Copy,
} from 'lucide-react'
import clsx from 'clsx'

import Tooltip from '../LLMTooltip'
import {
    listServers,
    createServer,
    updateServer,
    deleteServer,
    getServerStatus,
    mcpHttp
} from '@/app/lib/api/mcp'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { SpotifyLoginStatus } from './UI/SpotifyLoginStatus'
import { toast } from '@/app/common/toast/useToastStore'

interface ServerEntry {
    name: string
    alias: string
    description?: string
    type: 'MCP-Server' | 'MCP-RP' | 'MCP-Bridge'
    endpoint: string
    authType: 'none' | 'apiKey' | 'bearer' | 'basic'
    tags?: string[]
    status: 'active' | 'inactive'
    latency?: number
    timeoutMs: number
    healthCheck?: string
    lastChecked?: string
    error?: string
    enabled: boolean
    apiKey?: string
    apiKeyName?: string
    token?: string
    username?: string
    password?: string
}

const POLL_INTERVAL_MS = 3000
const LATENCY = { GOOD: 150, OK: 500 }

export default function IntegrationsPanel() {
    const activeModelId = useMCPStore(s => s.activeModelId)
    const configMap = useMCPStore(s => s.configMap)
    const integrations = activeModelId ? configMap[activeModelId]?.integrations ?? [] : []
    const updateConfig = useMCPStore((s) => s.updateConfig)

    const [servers, setServers] = useState<ServerEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newServer, setNewServer] = useState<Partial<ServerEntry>>({
        name: '',
        alias: '',
        description: '',
        endpoint: '',
        type: 'MCP-Server',
        authType: 'none',
        tags: [],
        timeoutMs: 30000,
        healthCheck: '',
        enabled: true
    })

    const availableAliases = [
        { value: 'spotify', label: 'Spotify' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'notion', label: 'Notion' },
        { value: 'wolfram', label: 'Wolfram Alpha' },
    ]

    const invalidUrl = (() => {
        try { new URL(newServer.endpoint || ''); return false } catch { return true }
    })()

    const needsAuthFields =
        newServer.authType === 'apiKey'  ? !(newServer.apiKey?.trim()) :
        newServer.authType === 'bearer' ? !(newServer.token?.trim()) :
        newServer.authType === 'basic'  ? !(newServer.username?.trim() && newServer.password?.trim()) :
        false

    const canSubmit =
        Boolean(newServer.name?.trim() && newServer.endpoint?.trim() && newServer.alias?.trim() && !invalidUrl && !needsAuthFields)

    const handleFieldChange = useCallback((key: keyof ServerEntry, value: any) => {
        setNewServer((prev) => ({ ...prev, [key]: value }))
    }, [])

    const serverMap = useMemo(() => {
        const m = new Map<string, ServerEntry>()
        servers.forEach((s) => m.set(s.alias, s))
        return m
    }, [servers])

    const inflight = useRef<Map<string, AbortController>>(new Map())

    const loadServers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await listServers()
            if (res.ok) {
                setServers((res.data as unknown) as ServerEntry[])
            } else {
                toast.error({ title: '로드 실패', description: res.error ?? '서버 목록을 불러오지 못했습니다.', compact: true })
            }
        } catch (e: any) {
            toast.error({ title: '로드 실패', description: e?.message ?? '서버 목록 오류', compact: true })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadServers()
    }, [loadServers])

    const refreshStatus = useCallback(
        async (alias: string) => {
            const srv = serverMap.get(alias)
            if (!srv || !srv.enabled) return

            const prev = inflight.current.get(alias)
            if (prev) {
                try { prev.abort() } catch {}
                inflight.current.delete(alias)
            }
            const ac = new AbortController()
            inflight.current.set(alias, ac)

            try {
                const res = await getServerStatus(alias, { signal: ac.signal })
                if (res.ok) {
                    setServers((list) => list.map((s) => (s.alias === alias ? { ...s, ...res.data, enabled: s.enabled } : s)))
                } else {
                    if (navigator.onLine) {
                        toast.error({ description: `상태 갱신 실패: ${res.error ?? 'unknown'}`, key: `rf-${alias}`, compact: true })
                    }
                }
            } catch (e: any) {
                if (e?.name !== 'AbortError' && navigator.onLine) {
                    toast.error({ description: '상태 갱신 중 오류가 발생했습니다.', key: `rf-${alias}`, compact: true })
                }
            } finally {
                inflight.current.delete(alias)
            }
        },
        [serverMap]
    )

    useEffect(() => {
        if (!activeModelId || integrations.length === 0) return
        const shouldPoll = () => !document.hidden && navigator.onLine

        let timer: number | null = null
        const tick = () => {
            if (!shouldPoll()) return
            integrations.forEach((alias) => {
                const srv = serverMap.get(alias)
                if (srv?.enabled) refreshStatus(alias)
            })
        }

        tick()
        timer = window.setInterval(tick, POLL_INTERVAL_MS)

        const onVis = () => { if (!document.hidden) tick() }
        const onNet = () => { if (navigator.onLine) tick() }
        document.addEventListener('visibilitychange', onVis)
        window.addEventListener('online', onNet)
        window.addEventListener('offline', onNet)

        return () => {
            if (timer) clearInterval(timer)
            document.removeEventListener('visibilitychange', onVis)
            window.removeEventListener('online', onNet)
            window.removeEventListener('offline', onNet)
        }
    }, [activeModelId, integrations, serverMap, refreshStatus])

    const toggleEnable = useCallback(
        async (alias: string, nextEnabled: boolean) => {
            const srv = serverMap.get(alias)
            if (!srv) return

            const prev = { ...srv }
            const next: ServerEntry = { ...srv, enabled: nextEnabled, status: nextEnabled ? 'active' : 'inactive' }
            setServers((list) => list.map((s) => (s.alias === alias ? next : s)))

            const res = await updateServer(alias, next)
            if (!res.ok) {
                setServers((list) => list.map((s) => (s.alias === alias ? prev : s)))
                toast.error({ title: '토글 실패', description: res.error ?? '서버 활성화 변경 실패', compact: true })
                return
            }
            if (nextEnabled) refreshStatus(alias)
        },
        [serverMap, refreshStatus]
    )

    const toggleAlias = useCallback(
        async (alias: string) => {
            if (!activeModelId) {
                toast.info({ description: '모델이 선택되지 않았습니다.', compact: true })
                return
            }
            const current = useMCPStore.getState().configMap[activeModelId]?.integrations ?? []
            const updated = current.includes(alias) ? current.filter((a) => a !== alias) : [...current, alias]

            updateConfig(activeModelId, { integrations: updated })

            const config = useMCPStore.getState().getCurrentConfig()
            if (!config) return

            try {
                await toast.promise(
                    mcpHttp.patch(`/llm/model/${encodeURIComponent(activeModelId)}/params`, config),
                    {
                        loading: { description: '구성 저장 중…', compact: true },
                        success: { description: '구성 저장됨', compact: true },
                        error: { description: '설정 저장 실패', compact: true },
                    }
                )
            } catch {
                updateConfig(activeModelId, { integrations: current })
            }
        },
        [activeModelId, updateConfig]
    )

    const registerServer = useCallback(async () => {
        if (!newServer.name || !newServer.endpoint || !newServer.alias) {
            toast.info({ description: '서버 이름, 엔드포인트, Alias는 필수입니다.', compact: true })
            return
        }
        try {
            await toast.promise(
                createServer({ ...(newServer as ServerEntry) } as any) as unknown as Promise<any>,
                {
                    loading: { description: '서버 등록 중…', compact: true },
                    success: { description: '서버 등록 완료', compact: true },
                    error: { description: '서버 등록 실패', compact: true },
                }
            )
            await loadServers()
            setShowAddModal(false)
            setNewServer({
                name: '',
                alias: '',
                description: '',
                endpoint: '',
                type: 'MCP-Server',
                authType: 'none',
                tags: [],
                timeoutMs: 30000,
                healthCheck: '',
                enabled: true,
            })
        } catch {}
    }, [newServer, loadServers])

    const confirmAndDelete = useCallback((alias: string) => {
        const id = toast.show({
            variant: 'warning',
            title: '삭제하시겠어요?',
            description: `${alias} 서버를 삭제합니다.`,
            actionText: '삭제',
            onAction: async () => {
                toast.dismiss(id)
                try {
                    await toast.promise(deleteServer(alias) as unknown as Promise<any>, {
                        loading: { description: '서버 삭제 중…', compact: true },
                        success: { description: '서버 삭제 완료', compact: true },
                        error: { description: '서버 삭제 실패', compact: true },
                    })
                    await loadServers()
                } catch {}
            },
            duration: 8000,
        })
    }, [loadServers])

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

    const copyEndpoint = useCallback(async (endpoint: string) => {
        try {
            await navigator.clipboard.writeText(endpoint)
            toast.success({ description: '엔드포인트 복사됨', key: `cp-${endpoint}`, compact: true })
        } catch {
            toast.error({ description: '클립보드 복사 실패', compact: true })
        }
    }, [])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'MCP-RP': return <Microchip className="w-3.5 h-3.5 text-white/60" />
            case 'MCP-Bridge': return <Link2 className="w-3.5 h-3.5 text-white/60" />
            case 'MCP-Server': return <ServerIcon className="w-3.5 h-3.5 text-white/60" />
            default: return null
        }
    }

    return (
        <div className="space-y-5"> 
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/80">등록된 MCP 서버</p>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-400 transition"
                >
                    <Plus className="w-3 h-3" />
                    <span>서버 추가</span>
                </button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[0,1,2].map(i => (
                        <div key={i} className="rounded-lg overflow-hidden relative p-3 bg-white/5">
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
                    {servers.map((srv) => (
                        <ServerCard
                            key={srv.alias}
                            srv={srv}
                            linked={integrations.includes(srv.alias)}
                            onRefresh={refreshStatus}
                            onToggleEnable={toggleEnable}
                            onToggleAlias={toggleAlias}
                            onDelete={confirmAndDelete}
                            onCopy={copyEndpoint}
                        />
                    ))}
                </div>
            )}

            {showAddModal && createPortal(
                <div
                    className={clsx(
                        'fixed inset-0 z-[9999] p-4 flex items-center justify-center',
                        'bg-gradient-to-br from-black/60 via-[#0b0b18]/50 to-black/60',
                        'backdrop-blur-sm'
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
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) registerServer()
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
                        aria-label="새 MCP 서버 등록"
                    >
                        <div className="sticky top-0 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-gradient-to-b from-[#2c2c3d] to-transparent flex items-center justify-between z-10">
                            <h4 className="text-xl font-semibold text-white tracking-wide">새 MCP 서버 등록</h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/70 hover:text-white rounded-md p-1 transition"
                                aria-label="닫기"
                            >✕</button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">서버 이름</label>
                            <input
                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                placeholder="예) Vector DB, Notion MCP…"
                                value={newServer.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">설명 (선택)</label>
                            <input
                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                placeholder="간단한 설명을 입력하세요"
                                value={newServer.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">타입</label>
                                <select
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    value={newServer.type}
                                    onChange={(e) => handleFieldChange('type', e.target.value)}
                                >
                                    <option className="text-black" value="MCP-Server">MCP Server</option>
                                    <option className="text-black" value="MCP-RP">MCP RP</option>
                                    <option className="text-black" value="MCP-Bridge">MCP Bridge</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] text-white/60">Alias</label>
                                    <span className="text-[10px] text-white/40">연동 구분에 사용</span>
                                </div>
                                <select
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    value={newServer.alias}
                                    onChange={(e) => {
                                        const alias = e.target.value
                                        handleFieldChange('alias', alias)
                                        if (alias === 'spotify') handleFieldChange('authType', 'none')
                                        else if (alias === 'wolfram') handleFieldChange('authType', 'apiKey')
                                    }}
                                >
                                    <option className="text-black" value="">추가할 서비스를 선택하세요.</option>
                                    {availableAliases.map((a) => (
                                        <option key={a.value} className="text-black" value={a.value}>{a.label}</option>
                                    ))}
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
                                placeholder="http://localhost:8500/spotify"
                                value={newServer.endpoint}
                                onChange={(e) => handleFieldChange('endpoint', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] text-white/60">인증 방식</label>
                            <select
                                className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                value={newServer.authType}
                                onChange={(e) => handleFieldChange('authType', e.target.value)}
                            >
                                <option className="text-black" value="none">Auth 없음</option>
                                <option className="text-black" value="apiKey">API Key</option>
                                <option className="text-black" value="bearer">Bearer Token</option>
                                <option className="text-black" value="basic">Basic Auth</option>
                            </select>
                        </div>

                        {newServer.authType === 'apiKey' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">API Key</label>
                                    <input
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                        placeholder="예) Bearer xxxxx 또는 실제 키"
                                        value={newServer.apiKey || ''}
                                        onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">Header 이름</label>
                                    <input
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                        placeholder="예) Authorization"
                                        value={newServer.apiKeyName ?? 'Authorization'}
                                        onChange={(e) => handleFieldChange('apiKeyName', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        {newServer.authType === 'bearer' && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">Bearer Token</label>
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="토큰 값"
                                    value={newServer.token || ''}
                                    onChange={(e) => handleFieldChange('token', e.target.value)}
                                />
                            </div>
                        )}
                        {newServer.authType === 'basic' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">Username</label>
                                    <input
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        value={newServer.username || ''}
                                        onChange={(e) => handleFieldChange('username', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] text-white/60">Password</label>
                                    <input
                                        type="password"
                                        className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        value={newServer.password || ''}
                                        onChange={(e) => handleFieldChange('password', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] text-white/60">Timeout (ms)</label>
                                <input
                                    type="number"
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    value={newServer.timeoutMs}
                                    onChange={(e) => handleFieldChange('timeoutMs', Number(e.target.value))}
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-[11px] text-white/60">Health Check Path (선택)</label>
                                <input
                                    className="w-full rounded-md bg-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 placeholder:text-white/35"
                                    placeholder="예) /healthz"
                                    value={newServer.healthCheck || ''}
                                    onChange={(e) => handleFieldChange('healthCheck', e.target.value)}
                                />
                            </div>
                        </div>

                        <label className="inline-flex items-center gap-2 select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={newServer.enabled}
                                onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                            />
                            <span className="text-white text-sm">Enabled</span>
                        </label>

                        {(!canSubmit) && (
                            <div className="rounded-md bg-rose-500/10 ring-1 ring-rose-400/30 p-3 text-[12px] text-rose-200 space-y-1">
                                {!newServer.name?.trim() && <div>· 이름을 입력해 주세요.</div>}
                                {(!newServer.alias?.trim()) && <div>· Alias를 선택해 주세요.</div>}
                                {(!newServer.endpoint?.trim() || invalidUrl) && <div>· 엔드포인트 URL을 확인해 주세요.</div>}
                                {needsAuthFields && <div>· 선택한 인증 방식의 필수 항목을 채워주세요.</div>}
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
                                onClick={registerServer}
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

const ServerCard = React.memo(function ServerCard({
    srv,
    linked,
    onRefresh,
    onToggleEnable,
    onToggleAlias,
    onDelete,
    onCopy,
}: {
    srv: ServerEntry
    linked: boolean
    onRefresh: (alias: string) => void
    onToggleEnable: (alias: string, next: boolean) => void
    onToggleAlias: (alias: string) => void
    onDelete: (alias: string) => void
    onCopy: (endpoint: string) => void
}) {
    const latencyTone =
        typeof srv.latency !== 'number' ? 'text-white/60'
        : srv.latency <= LATENCY.GOOD ? 'text-emerald-300'
        : srv.latency <= LATENCY.OK ? 'text-amber-300'
        : 'text-rose-300'

    return (
        <div className="relative rounded-xl p-2 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition group overflow-hidden">
            <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-500"
                style={{
                    background: 'radial-gradient(1200px 200px at 10% -10%, rgba(99,102,241,0.18), transparent 40%), radial-gradient(800px 160px at 110% 120%, rgba(20,184,166,0.16), transparent 40%)'
                }} />

            <div className="flex justify-between items-start mb-1 relative">
                <div className="flex items-start gap-2 min-w-0">
                    {srv.type === 'MCP-RP' ? <Microchip className="w-3.5 h-3.5 text-white/60" />
                    : srv.type === 'MCP-Bridge' ? <Link2 className="w-3.5 h-3.5 text-white/60" />
                    : <ServerIcon className="w-3.5 h-3.5 text-white/60" />}

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-[12px] font-medium truncate">{srv.name}</span>
                            <span className="text-white/50 text-[8px]">({srv.alias})</span>
                        </div>
                        {srv.description && <span className="text-white/60 text-[9px] truncate">{srv.description}</span>}

                        <div className="flex items-center gap-1">
                            <Tooltip content={srv.endpoint}>
                                <span className="text-white/40 text-[8px] truncate max-w-[42ch]">{srv.endpoint}</span>
                            </Tooltip>
                            <button
                                className="p-0.5 rounded hover:bg-white/10 text-white/70"
                                onClick={() => onCopy(srv.endpoint)}
                                aria-label="엔드포인트 복사"
                                title="복사"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className="text-white/50 hover:text-red-400 rounded p-1"
                        onClick={() => onDelete(srv.alias)}
                        aria-label="서버 삭제"
                        title="삭제"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-2 ml-1">
                {srv.enabled ? (
                    srv.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
                            <Wifi className="w-3 h-3" />
                            Online
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-300">
                            <WifiOff className="w-3 h-3" />
                            Offline
                        </span>
                    )
                ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/50">
                        <WifiOff className="w-3 h-3" />
                        비활성화됨
                    </span>
                )}

                <span className={clsx('inline-flex items-center gap-1 text-[10px]', latencyTone)}>
                    <ShieldCheck className="w-3 h-3" />
                    {srv.latency ?? '—'}ms
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] text-white/70">
                    <Clock className="w-3 h-3" />
                    {srv.timeoutMs}ms
                </span>

                {Array.isArray(srv.tags) && srv.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {srv.tags.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/10 text-white/70 border border-white/10">
                                {t}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {srv.alias === 'spotify' && (
                <div className="ml-1 mb-1">
                    <SpotifyLoginStatus />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[9px] text-white/65 ml-1">
                {srv.healthCheck && (
                    <Tooltip content={`Health Check: ${srv.healthCheck}`}>
                        <span className="underline decoration-dotted cursor-help">{srv.healthCheck}</span>
                    </Tooltip>
                )}
                {srv.lastChecked && <span>Last: {srv.lastChecked}</span>}
                {srv.error && (
                    <Tooltip content={srv.error}>
                        <span className="text-rose-400 underline decoration-dotted cursor-help">Error</span>
                    </Tooltip>
                )}

                <button
                    className="text-white/50 hover:text-white/80 rounded p-1"
                    onClick={() => onRefresh(srv.alias)}
                    title="상태 새로고침"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>

                <div
                    className="w-7 h-3.5 bg-white/20 rounded-full relative cursor-pointer"
                    onClick={() => onToggleEnable(srv.alias, !srv.enabled)}
                    title={srv.enabled ? '비활성화' : '활성화'}
                >
                    <div
                        className={clsx(
                            'w-2.5 h-2.5 rounded-full absolute top-0.5 transition-all',
                            srv.enabled ? 'left-3.5 bg-indigo-400' : 'left-0.5 bg-white/40'
                        )}
                    />
                </div>

                <button
                    onClick={() => onToggleAlias(srv.alias)}
                    className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] border transition',
                        linked
                            ? 'bg-indigo-500/90 text-white border-indigo-400'
                            : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                    )}
                >
                    {linked ? '연결됨' : '미연결'}
                </button>
            </div>
        </div>
    )
})