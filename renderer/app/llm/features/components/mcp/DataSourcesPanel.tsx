// app/llm/features/components/mcp/DataSourcesPanel.tsx
'use client'

import { useState } from 'react'
import LocalSourcesPanel from './data/LocalSourcesPanel'
import RemoteSourcesPanel from './data/RemoteSourcesPanel'

const tabs = ['Local', 'Remote']

export default function DataSourcesPanel() {
    const [selected, setSelected] = useState('Local')

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setSelected(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                    ${selected === tab
                        ? 'bg-indigo-500/10 text-indigo-300'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'}
                    `}
                >
                    {tab}
                </button>
                ))}
            </div>

            <div className="mt-2 text-sm text-white/80">
                {selected === 'Local' && <LocalSourcesPanel />}
                {selected === 'Remote' && <RemoteSourcesPanel />}
            </div>
        </div>
    )
}
