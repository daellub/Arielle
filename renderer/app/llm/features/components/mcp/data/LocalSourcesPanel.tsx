// components/mcp/data/LocalSourcesPanel.tsx
'use client'

import { useState } from 'react'
import { Trash2, RefreshCw, HardDrive } from 'lucide-react'
import clsx from 'clsx'

interface LocalSource {
    name: string
    path: string
    type: 'folder' | 'database'
    status: 'active' | 'inactive'
    enabled: boolean
}

const dummySources: LocalSource[] = [
    { name: '문서 폴더', path: '/Users/dael/Documents', type: 'folder', status: 'active', enabled: true },
    { name: 'ASR 결과 DB', path: 'mysql://localhost:3306/asr_db', type: 'database', status: 'inactive', enabled: false }
]

export default function LocalSourcesPanel() {
    const [sources, setSources] = useState<LocalSource[]>(dummySources)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">📁 Local 소스</h3>
                <button className="text-xs text-indigo-300 hover:text-indigo-400 transition">+ 소스 추가</button>
            </div>

            {sources.map((src, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-white/5 hover:bg-white/10 transition text-xs"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-1 text-white font-medium">
                            <HardDrive className="w-3.5 h-3.5 text-white/40" />
                            {src.name}
                        </div>
                        <div className="text-white/40 text-[11px]">{src.path}</div>
                    </div>

                    <div className="flex items-center gap-2">
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

