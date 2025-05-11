'use client'

import { useState } from 'react'
import { Microchip, Server, Link2, Plus, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'

interface ServerEntry {
    name: string
    type: string
    endpoint: string
    status: 'connected' | 'disconnected'
    latency?: number
    enabled: boolean
}

const dummyServers: ServerEntry[] = [
    { name: 'ArliAI Core', type: 'MCP-RP', endpoint: 'http://localhost:8000', status: 'connected', latency: 86, enabled: true },
    { name: 'LLM Proxy', type: 'MCP-Bridge', endpoint: 'http://127.0.0.1:5000', status: 'disconnected', latency: undefined, enabled: false },
]

function getTypeIcon(type: string) {
    switch (type) {
        case 'MCP-RP': return <Microchip className="w-3.5 h-3.5 text-white/40" />
        case 'MCP-Bridge': return <Link2 className="w-3.5 h-3.5 text-white/40" />
        case 'MCP-Server': return <Server className="w-3.5 h-3.5 text-white/40" />
        default: return null
    }
}

export default function IntegrationsPanel() {
    const [servers, setServers] = useState<ServerEntry[]>(dummyServers)
    const [showAddModal, setShowAddModal] = useState(false)

    const [newServer, setNewServer] = useState({
        name: '',
        description: '',
        endpoint: '',
        alias: '',
        authType: 'none',
        apiKey: '',
        token: '',
        username: '',
        password: '',
        timeoutMs: 30000,
        healthCheck: '',
        enabled: true,
    })

    const handleFieldChange = (key: string, value: any) => {
        setNewServer(prev => ({ ...prev, [key]: value }))
    }

    const registerServer = () => {
        // TODO: 실제 백엔드 코드로 교체 예정
        console.log('Registering MCP server:', newServer)
        setServers([...servers, { name: newServer.name, type: newServer.alias || 'MCP-Server', endpoint: newServer.endpoint, status: 'disconnected', enabled: newServer.enabled }])
        setShowAddModal(false)
        setNewServer({ name: '', description: '', endpoint: '', alias: '', authType: 'none', apiKey: '', token: '', username: '', password: '', timeoutMs: 30000, healthCheck: '', enabled: true })
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">등록된 MCP 서버</h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-400 transition"
                >
                    <Plus className="w-4 h-4" />
                    서버 추가
                </button>
            </div>

            <div className="space-y-4">
                {servers.map((srv, i) => (
                    <div key={i} className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                            <div className="pt-0.5">{getTypeIcon(srv.type)}</div>
                            <div className="flex flex-col">
                                <span className="text-white font-medium">{srv.name}</span>
                                <span className="text-white/50 text-[9px] truncate">{srv.endpoint}</span>
                                <span className="text-white/40 text-[10px]">{srv.type}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px]">
                            {srv.status === 'connected'
                                ? <Wifi className="w-3.5 h-3.5 text-green-400" />
                                : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                            <span className={clsx('font-medium', {
                                'text-green-400': srv.status === 'connected',
                                'text-red-400': srv.status === 'disconnected',
                            })}>
                                {srv.status === 'connected' ? 'Online' : 'Offline'}
                            </span>

                            <div className="text-white/40 w-[32px] text-right">
                                {srv.latency !== undefined ? `${srv.latency}ms` : '—'}
                            </div>

                            <button className="text-white/40 hover:text-white/70">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-7 h-4 bg-white/20 rounded-full relative cursor-pointer">
                                <div className={clsx(
                                    'w-3 h-3.5 rounded-full absolute top-0.5 transition-all',
                                    srv.enabled ? 'left-3 bg-indigo-400' : 'left-0.5 bg-white/40'
                                )} />
                            </div>

                            <button className="text-white/30 hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-[320px]">
                        <div className="text-white font-semibold text-sm">새 MCP 서버 등록</div>
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
                            <option value="none" className="text-black">Auth 없음</option>
                            <option value="apiKey" className="text-black">API Key</option>
                            <option value="bearer" className="text-black">Bearer Token</option>
                            <option value="basic" className="text-black">Basic Auth</option>
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
                                className="w-20 p-2 rounded bg-white/10 text-white text-sm"
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
                                checked={newServer.enabled}
                                onChange={e => handleFieldChange('enabled', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                </div>
            )}
        </div>
    )
}
