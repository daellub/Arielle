// app/llm/features/components/mcp/ToolsPanel.tsx
'use client'

import { useState } from 'react'
import { Trash2, RefreshCw, Wrench } from 'lucide-react'
import clsx from 'clsx'

interface Tool {
    name: string
    type: string
    command: string
    status: 'active' | 'inactive'
    enabled: boolean
}

const dummyTools: Tool[] = [
    { name: 'Calculator', type: 'python', command: 'calculate(expression)', status: 'active', enabled: true },
    { name: 'Browser Search', type: 'rest', command: 'GET https://api.search.com?q={query}', status: 'inactive', enabled: false }
]

export default function ToolsPanel() {
    const [tools, setTools] = useState<Tool[]>(dummyTools)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">🛠️ 툴 목록</h3>
                <button className="text-xs text-indigo-300 hover:text-indigo-400 transition">+ 툴 추가</button>
            </div>

            {tools.map((tool, i) => (
                <div
                    key={i}
                    className="flex flex-col p-3 rounded-md bg-white/5 hover:bg-white/10 transition text-xs gap-1"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-white font-medium">
                            <Wrench className="w-3.5 h-3.5 text-white/40" />
                            {tool.name}
                            <span className="ml-1 text-white/40 text-[10px] ml-1">
                                ({tool.type})
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className={clsx('text-[11px] font-medium', {
                                'text-green-400': tool.status === 'active',
                                'text-red-400': tool.status === 'inactive'
                            })}>
                                {tool.status === 'active' ? 'Active' : 'Inactive'}
                            </span>

                            <button className="text-white/40 hover:text-white/70">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-7 h-4 bg-white/20 rounded-full relative cursor-pointer">
                                <div className={clsx(
                                    'w-3 h-3.5 rounded-full absolute top-0.5 transition-all',
                                    tool.enabled ? 'left-3 bg-indigo-400' : 'left-0.5 bg-white/40'
                                )} />
                            </div>

                            <button className="text-white/30 hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="text-white/50 text-[11px] truncate max-w-[200px]">{tool.command}</div>
                </div>
            ))}
        </div>
    )
}
