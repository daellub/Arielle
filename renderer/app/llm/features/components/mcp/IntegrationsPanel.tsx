'use client'

import { useEffect, useState } from 'react'
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
    WifiOff
} from 'lucide-react'
import clsx from 'clsx'

import Tooltip from '../LLMTooltip'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import {
    listServers,
    createServer,
    updateServer,
    deleteServer,
    getServerStatus
} from '@/app/lib/api/mcp'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { SpotifyLoginStatus } from './UI/SpotifyLoginStatus'

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
    token?: string
    username?: string
    password?: string
}

export default function IntegrationsPanel() {
    const activeModelId = useMCPStore(s => s.activeModelId)
    const configMap = useMCPStore(s => s.configMap)
    const integrations = activeModelId ? configMap[activeModelId]?.integrations ?? [] : []
    const updateConfig = useMCPStore(s => s.updateConfig)
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

    const notify = useNotificationStore((s) => s.show)

    const handleFieldChange = (key: keyof ServerEntry, value: any) =>
        setNewServer((prev) => ({ ...prev, [key]: value }))

    useEffect(() => {
        loadServers()
    }, [])

    useEffect(() => {
        if (!activeModelId || integrations.length === 0) return

        const interval = setInterval(() => {
            integrations.forEach(alias => {
                const server = servers.find(s => s.alias === alias)
                if (server?.enabled) refreshStatus(alias)
            })
        }, 900)

        return () => clearInterval(interval)
    }, [activeModelId, integrations, servers])

    // useEffect(() => {
    //     if (!activeModelId || !servers.length) return
        
    //     const aliases = configMap[activeModelId]?.integrations ?? []

    //     aliases.forEach(alias => {
    //         const server = servers.find(s => s.alias === alias)
    //         if (server?.enabled) refreshStatus(alias)
    //     })
    // }, [activeModelId, servers])

    async function loadServers() {
        setLoading(true)
        try {
            const res = await listServers()
            setServers(res.data as ServerEntry[])
        } catch (error) {
            console.error('Error loading servers:', error)
        } finally {
            setLoading(false)
        }
    }

    async function refreshStatus(alias: string) {
        const server = servers.find(s => s.alias === alias)
        if (!server || !server.enabled) return

        try {
            const res = await getServerStatus(alias)
            setServers((list) =>
                list.map((s) =>
                    s.alias === alias ? { ...s, ...res.data, enabled: s.enabled } : s
                )
            )
        } catch (err) {
            console.error('상태 갱신 실패:', err)
            notify('상태 갱신에 실패했습니다.', 'error')
        }
    }

    async function toggleEnable(alias: string, enabled: boolean) {
        try {
            const server = servers.find(s => s.alias === alias)
            if (!server) return

            const status: 'active' | 'inactive' = enabled ? 'active' : 'inactive'
            const updatedServer: ServerEntry = { ...server, enabled, status }

            await updateServer(alias, updatedServer)

            setServers((list) =>
                list.map((s) => s.alias === alias ? updatedServer : s)
            )
        } catch (err) {
            console.error('토글 실패:', err)
            notify('서버 활성화 토글 실패', 'error')
        }
    }

    async function toggleAlias(alias: string) {
        if (!activeModelId) {
            notify('모델이 선택되지 않았습니다.', 'info')
            return
        }

        const current = useMCPStore.getState().configMap[activeModelId]?.integrations ?? []
        const updated = current.includes(alias)
            ? current.filter(a => a !== alias)
            : [...current, alias]

        updateConfig(activeModelId, { integrations: updated })

        const config = useMCPStore.getState().getCurrentConfig()
        if (!config) return

        try {
            await axios.patch(
                `http://localhost:8500/mcp/llm/model/${activeModelId}/params`,
                config
            )
        } catch (err) {
            console.error('설정 저장 실패: ', err)
            notify('설정을 저장하는 중 오류가 발생했습니다.', 'error')
        }
    }

    async function registerServer() {
        if (!newServer.name || !newServer.endpoint || !newServer.alias) {
            notify('서버 이름, 엔드포인트, Alias는 필수입니다.', 'info')
            return
        }

        try {
            await createServer({ ...(newServer as ServerEntry) })
            notify('서버 등록 완료', 'success')
            loadServers()
            setShowAddModal(false)
            setNewServer({
                name: '', alias: '', description: '', endpoint: '',
                type: 'MCP-Server', authType: 'none', tags: [],
                timeoutMs: 30000, healthCheck: '', enabled: true
            })
        } catch (err) {
            console.error('서버 등록 실패:', err)
            notify('서버 등록을 실패했습니다.', 'error')
        }
    }

    async function deleteServerFromAPI(alias: string) {
        try {
            await deleteServer(alias)
            notify('서버 삭제 완료', 'success')
            await loadServers()
            setShowAddModal(false)
        } catch (err) {
            console.error('서버 삭제 실패:', err)
            notify('서버 삭제를 실패했습니다.', 'error')
        }
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case 'MCP-RP':     return <Microchip   className="w-3.5 h-3.5 text-white/40" />
            case 'MCP-Bridge': return <Link2       className="w-3.5 h-3.5 text-white/40" />
            case 'MCP-Server': return <ServerIcon  className="w-3.5 h-3.5 text-white/40" />
            default:           return null
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

            {loading
                ? <div className="text-sm text-white/60">로딩 중…</div>
                : <div className="space-y-2">
                    {servers.map((srv, i) => (
                        <div key={i} className="bg-white/5 p-2 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-start gap-2">
                                    {getTypeIcon(srv.type)}
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-white text-[12px] font-medium">{srv.name}</span>
                                            <span className="text-white/50 text-[8px]">({srv.alias})</span>
                                        </div>
                                        {srv.description && <span className="text-white/50 text-[9px]">{srv.description}</span>}
                                        <span className="text-white/40 text-[8px] truncate">{srv.endpoint}</span>
                                    </div>
                                </div>
                                <button
                                    className="text-white/40 hover:text-red-400"
                                    onClick={() => deleteServerFromAPI(srv.alias)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-2 ml-1">
                                {srv.enabled ? (
                                    srv.status === 'active' ? (
                                        <>
                                            <Wifi className="w-3 h-3 text-green-400" />
                                            <p className="text-[10px] font-medium text-green-400">Online</p>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff className="w-3 h-3 text-red-400" />
                                            <p className="text-[10px] font-medium text-red-400">Offline</p>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <WifiOff className="w-3 h-3 text-white/40" />
                                        <p className="text-[10px] font-medium text-white/40">비활성화됨</p>
                                    </>
                                )}
                                
                                <p className="text-[10px]">↔ {srv.latency ?? '—'}ms</p>
                                <p className="text-[10px]">⏱ {srv.timeoutMs}ms</p>
                            </div>

                            {srv.alias === 'spotify' && integrations.includes('spotify') && (
                                <SpotifyLoginStatus />
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-[9px] text-white/60">
                                {srv.healthCheck && (
                                    <Tooltip content={`Health Check: ${srv.healthCheck}`}>
                                        <span className="underline decoration-dotted cursor-help">{srv.healthCheck}</span>
                                    </Tooltip>
                                )}
                                {srv.lastChecked && <span>Last: {srv.lastChecked}</span>}
                                {srv.error && (
                                    <Tooltip content={srv.error}>
                                        <span className="text-red-400 underline decoration-dotted cursor-help">Error</span>
                                    </Tooltip>
                                )}
                                <button
                                    className="text-white/40 hover:text-white/70"
                                    onClick={() => refreshStatus(srv.alias)}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                                <div
                                    className="w-6 h-3.5 bg-white/20 rounded-full relative cursor-pointer"
                                    onClick={() => toggleEnable(srv.alias, !srv.enabled)}
                                >
                                    <div className={clsx(
                                        'w-2.5 h-2.5 rounded-full absolute top-0.5 transition-all',
                                        srv.enabled ? 'left-2 bg-indigo-400' : 'left-0.5 bg-white/40'
                                    )} />
                                </div>
                                <button
                                    onClick={() => toggleAlias(srv.alias)}
                                    className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] border transition",
                                        integrations.includes(srv.alias)
                                            ? "bg-indigo-500 text-white border-indigo-400"
                                            : "bg-white/10 text-white/40 border-white/20 hover:bg-white/20"
                                    )}
                                >
                                    {integrations.includes(srv.alias) ? '연결됨' : '미연결'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            }

            {showAddModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-[90%] max-w-lg max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white">새 MCP 서버 등록</h4>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-white/50 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="서버 이름"
                            value={newServer.name}
                            onChange={e => handleFieldChange('name', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="설명 (선택)"
                            value={newServer.description}
                            onChange={e => handleFieldChange('description', e.target.value)}
                        />
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={newServer.type}
                            onChange={e => handleFieldChange('type', e.target.value)}
                        >
                            <option className="text-black" value="MCP-Server">MCP Server</option>
                            <option className="text-black" value="MCP-RP">MCP RP</option>
                            <option className="text-black" value="MCP-Bridge">MCP Bridge</option>
                        </select>
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="엔드포인트 URL"
                            value={newServer.endpoint}
                            onChange={e => handleFieldChange('endpoint', e.target.value)}
                        />
                        <div className='flex items-center gap-2'>
                            <label className="text-white text-sm">Alias</label>
                            <select
                                className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                value={newServer.alias}
                                onChange={(e) => {
                                    const alias = e.target.value
                                    handleFieldChange('alias', alias)

                                    if (alias === 'spotify') {
                                        handleFieldChange('authType', 'none')
                                    } else if (alias === 'wolfram') {
                                        handleFieldChange('authType', 'apiKey')
                                    }
                                }}
                            >
                                <option className="text-black" value="">추가할 서비스를 선택하세요.</option>
                                {availableAliases.map((a) => (
                                    <option key={a.value} className="text-black" value={a.value}>
                                        {a.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={newServer.authType}
                            onChange={e => handleFieldChange('authType', e.target.value)}
                        >
                            <option className="text-black" value="none">Auth 없음</option>
                            <option className="text-black" value="apiKey">API Key</option>
                            <option className="text-black" value="bearer">Bearer Token</option>
                            <option className="text-black" value="basic">Basic Auth</option>
                        </select>

                        {newServer.authType === 'apiKey' && (
                            <input
                                className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                placeholder="API Key"
                                value={newServer.apiKey}
                                onChange={e => handleFieldChange('apiKey', e.target.value)}
                            />
                        )}
                        {newServer.authType === 'bearer' && (
                            <input
                                className="w-full p-2 rounded bg-white/10 text-white text-sm"
                                placeholder="Bearer Token"
                                value={newServer.token}
                                onChange={e => handleFieldChange('token', e.target.value)}
                            />
                        )}
                        {newServer.authType === 'basic' && (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="p-2 rounded bg-white/10 text-white text-sm"
                                    placeholder="Username"
                                    value={newServer.username}
                                    onChange={e => handleFieldChange('username', e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="p-2 rounded bg-white/10 text-white text-sm"
                                    placeholder="Password"
                                    value={newServer.password}
                                    onChange={e => handleFieldChange('password', e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                className="w-24 p-2 rounded bg-white/10 text-white text-sm"
                                placeholder="Timeout(ms)"
                                value={newServer.timeoutMs}
                                onChange={e => handleFieldChange('timeoutMs', Number(e.target.value))}
                            />
                            <input
                                className="flex-1 p-2 rounded bg-white/10 text-white text-sm"
                                placeholder="Health Check Path (선택)"
                                value={newServer.healthCheck}
                                onChange={e => handleFieldChange('healthCheck', e.target.value)}
                            />
                        </div>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={newServer.enabled}
                                onChange={e => handleFieldChange('enabled', e.target.checked)}
                            />
                            <span className="text-white text-sm">Enabled</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-xs text-white/50"
                            >
                                취소
                            </button>
                            <button
                                onClick={registerServer}
                                className="text-xs text-indigo-300"
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
