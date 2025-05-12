'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
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

interface ServerEntry {
    name: string
    alias: string
    description?: string
    type: string
    endpoint: string
    authType: 'none' | 'apiKey' | 'bearer' | 'basic'
    tags?: string[]
    status: 'connected' | 'disconnected'
    latency?: number
    timeoutMs: number
    healthCheck?: string
    lastChecked?: string
    error?: string
    enabled: boolean
}

const dummyServers: ServerEntry[] = [
    {
        name: 'ArliAI Core',
        alias: 'arielle-mcp',
        description: '컨텍스트+LLM 호출 서버',
        type: 'MCP-RP',
        endpoint: 'http://localhost:8000',
        authType: 'bearer',
        tags: ['LLM', 'Memory'],
        status: 'connected',
        latency: 86,
        timeoutMs: 30000,
        healthCheck: '/health',
        lastChecked: '2분 전',
        enabled: true
    },
    {
        name: 'LLM Proxy',
        alias: 'llm-proxy',
        description: '외부 LLM 브릿지',
        type: 'MCP-Bridge',
        endpoint: 'http://127.0.0.1:5000',
        authType: 'none',
        tags: ['Bridge'],
        status: 'disconnected',
        timeoutMs: 30000,
        lastChecked: '5분 전',
        error: '401 Unauthorized',
        enabled: false
    }
]

function getTypeIcon(type: string) {
    switch (type) {
        case 'MCP-RP':     return <Microchip   className="w-3.5 h-3.5 text-white/40" />
        case 'MCP-Bridge': return <Link2       className="w-3.5 h-3.5 text-white/40" />
        case 'MCP-Server': return <ServerIcon  className="w-3.5 h-3.5 text-white/40" />
        default:           return null
    }
}

export default function IntegrationsPanel() {
    const [servers,      setServers]      = useState<ServerEntry[]>(dummyServers)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newServer,    setNewServer]    = useState<Partial<ServerEntry>>({
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

    const handleFieldChange = (key: string, value: any) =>
        setNewServer(prev => ({ ...prev, [key]: value }))

    const registerServer = () => {
        const entry = {
            name:        newServer.name || '',
            alias:       newServer.alias || '',
            description: newServer.description,
            type:        newServer.type || 'MCP-Server',
            endpoint:    newServer.endpoint || '',
            authType:    newServer.authType || 'none',
            tags:        newServer.tags || [],
            status:      'disconnected' as const,
            latency:     undefined,
            timeoutMs:   newServer.timeoutMs || 30000,
            healthCheck: newServer.healthCheck,
            lastChecked: undefined,
            error:       undefined,
            enabled:     newServer.enabled ?? true
        }
        setServers([...servers, entry])
        setShowAddModal(false)
        setNewServer({ name: '', alias: '', type: 'MCP-Server', endpoint: '', authType: 'none', tags: [], timeoutMs: 30000, enabled: true })
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

            <div className="space-y-2">
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
                                    {srv.description && (
                                        <span className="text-white/50 text-[9px]">{srv.description}</span>
                                    )}
                                    <span className="text-white/40 text-[8px] truncate">{srv.endpoint}</span>
                                </div>
                            </div>
                            <button className="text-white/40 hover:text-red-400">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-2 ml-1">
                            {srv.status === 'connected'
                                ? <Wifi    className="w-3 h-3 text-green-400" />
                                : <WifiOff className="w-3 h-3 text-red-400" />
                            }
                            <p className={clsx('text-[10px] font-medium', {
                                'text-green-400': srv.status === 'connected',
                                'text-red-400':   srv.status === 'disconnected'
                            })}>
                                {srv.status === 'connected' ? 'Online' : 'Offline'}
                            </p>
                            <p className="text-[10px]">↔ {srv.latency != null ? `${srv.latency}ms` : '—'}</p>
                            <p className="text-[10px]">⏱ {srv.timeoutMs}ms</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[9px] text-white/60">
                            {srv.healthCheck && (
                                <Tooltip content={`Health Check Path: ${srv.healthCheck}`}>
                                    <span className="underline decoration-dotted cursor-help text-[9px]">
                                        {srv.healthCheck}
                                    </span>
                                </Tooltip>
                            )}
                            <span title={`Auth Type: ${srv.authType}`}>{srv.authType}</span>
                            <Tooltip content={`Auth Type: ${srv.authType}`}>
                                <span className="underline decoration-dotted cursor-help text-[9px]">
                                    {srv.authType}
                                </span>
                            </Tooltip>
                            {srv.lastChecked && (
                                <span>Last: {srv.lastChecked}</span>
                            )}
                            {srv.error && (
                                <Tooltip content={srv.error}>
                                    <span className="text-red-400 underline decoration-dotted cursor-help text-[9px]">
                                        Error: {srv.error}
                                    </span>
                                </Tooltip>

                            )}
                            <button className="text-white/40 hover:text-white/70">
                                <RefreshCw className="w-3 h-3" />
                            </button>
                            <div className="w-6 h-3.5 bg-white/20 rounded-full relative cursor-pointer">
                                <div className={clsx(
                                    'w-2.5 h-2.5 rounded-full absolute top-0.5 transition-all',
                                    srv.enabled
                                        ? 'left-2 bg-indigo-400'
                                        : 'left-0.5 bg-white/40'
                                )} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="엔드포인트 URL"
                            value={newServer.endpoint}
                            onChange={e => handleFieldChange('endpoint', e.target.value)}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="Alias (ID)"
                            value={newServer.alias}
                            onChange={e => handleFieldChange('alias', e.target.value)}
                        />

                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            value={newServer.authType}
                            onChange={e => handleFieldChange('authType', e.target.value)}
                        >
                            <option value="none">Auth 없음</option>
                            <option value="apiKey">API Key</option>
                            <option value="bearer">Bearer Token</option>
                            <option value="basic">Basic Auth</option>
                        </select>

                        {/* {newServer.authType === 'apiKey' && (
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
                        )} */}

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
