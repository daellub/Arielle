// components/mcp/data/RemoteSourcesPanel.tsx
'use client'

import { useState } from 'react'
import { Trash2, RefreshCw, Globe, Lock } from 'lucide-react'
import clsx from 'clsx'

interface RemoteSource {
    name: string
    endpoint: string
    auth: boolean
    status: 'active' | 'inactive'
    enabled: boolean
}

const dummyRemoteSources: RemoteSource[] = [
    { name: 'HuggingFace API', endpoint: 'https://api.huggingface.co/llm/infer', auth: true, status: 'active', enabled: true },
    { name: 'ArliAI Log API', endpoint: 'http://127.0.0.1:5001/logs', auth: false, status: 'inactive', enabled: false }
]

export default function RemoteSourcesPanel() {
    const [sources, setSources] = useState<RemoteSource[]>(dummyRemoteSources)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">🌐 Remote 소스</h3>
                <button className="text-xs text-indigo-300 hover:text-indigo-400 transition">+ API 추가</button>
            </div>

            {sources.map((src, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-white/5 hover:bg-white/10 transition text-xs"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-1 text-white font-medium">
                            <Globe className="w-3.5 h-3.5 text-white/40" />
                            {src.name}
                            {src.auth && <Lock className="w-3 h-3 text-yellow-400 ml-1" />}
                        </div>
                        <div className="text-white/40 text-[11px] truncate max-w-[180px]">{src.endpoint}</div>
                    </div>

                    {/* 조작부 */}
                    <div className="flex items-center gap-1">
                        <span className={clsx('text-[11px] font-medium', {
                            'text-green-400': src.status === 'active',
                            'text-red-400': src.status === 'inactive'
                        })}>
                            {src.status === 'active' ? 'Active' : 'Inactive'}
                        </span>

                        <button className="text-white/40 hover:text-white/70">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-7 h-4 bg-white/20 rounded-full relative cursor-pointer">
                            <div className={clsx(
                                'w-3 h-3.5 rounded-full absolute top-0.5 transition-all',
                                src.enabled ? 'left-3 bg-indigo-400' : 'left-0.5 bg-white/40'
                            )} />
                        </div>

                        <button className="text-white/30 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

