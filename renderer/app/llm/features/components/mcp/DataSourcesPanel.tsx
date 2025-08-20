// app/llm/features/components/mcp/DataSourcesPanel.tsx
'use client'

import { useCallback, useMemo, useState } from 'react'
import LocalSourcesPanel from './data/LocalSourcesPanel'
import RemoteSourcesPanel from './data/RemoteSourcesPanel'

type Tab = 'Local' | 'Remote'
const TABS = ['Local', 'Remote'] as const satisfies Readonly<Tab[]>

export default function DataSourcesPanel() {
    const [selected, setSelected] = useState<Tab>('Local')

    const currentIndex = useMemo(() => TABS.indexOf(selected), [selected])

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const next = (currentIndex + dir + TABS.length) % TABS.length
        setSelected(TABS[next])
    }, [currentIndex])

    return (
        <div className="space-y-4">
            <div
                role="tablist"
                aria-label="데이터 소스 유형"
                className="flex gap-2"
                onKeyDown={onKeyDown}
            >
                {TABS.map((tab) => {
                    const active = selected === tab
                    return (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={active}
                            aria-controls={`panel-${tab.toLowerCase()}`}
                            onClick={() => setSelected(tab)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-indigo-400/40
                                ${active
                                    ? 'bg-indigo-500/10 text-indigo-300'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'}
                            `}
                        >
                            {tab}
                        </button>
                    )
                })}
            </div>

            <div className="mt-2 text-sm text-white/80">
                <div
                    id="panel-local"
                    role="tabpanel"
                    aria-labelledby="tab-local"
                    hidden={selected !== 'Local'}
                >
                    <LocalSourcesPanel />
                </div>
                <div
                    id="panel-remote"
                    role="tabpanel"
                    aria-labelledby="tab-remote"
                    hidden={selected !== 'Remote'}
                >
                    <RemoteSourcesPanel />
                </div>
            </div>
        </div>
    )
}
