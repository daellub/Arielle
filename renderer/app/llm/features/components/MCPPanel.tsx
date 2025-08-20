// app/llm/features/components/MCPPanel.tsx
'use client'

import { useMemo, useState, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import LLMModelsPanel from './mcp/LLMModelsPanel'
import IntegrationsPanel from './mcp/IntegrationsPanel'
import DataSourcesPanel from './mcp/DataSourcesPanel'
import PromptsPanel from './mcp/PromptsPanels'
import ToolsPanel from './mcp/ToolsPanel'
import MemoryContextPanel from './mcp/MemoryContextPanel'
import SamplingPanel from './mcp/SamplingPanel'
import SecurityPanel from './mcp/SecurityPanel'
import LogsPanel from './mcp/LogPanel'

const tabs = [
    'LLM Models', 'Integrations', 'Data Sources', 'Prompts', 'Tools',
    'Memory/Context', 'Sampling', 'Security', 'Logs'
] as const

type Tab = (typeof tabs)[number]

export default function MCPPanel() {
    const [selected, setSelected] = useState<Tab>('LLM Models')

    const onKeyNav = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
            e.preventDefault()
            const i = tabs.indexOf(selected)
            const next =
                e.key === 'ArrowRight'
                    ? tabs[(i + 1) % tabs.length]
                    : tabs[(i - 1 + tabs.length) % tabs.length]
            setSelected(next)
        },
        [selected]
    )

    const content = useMemo(() => {
        switch (selected) {
            case 'LLM Models':
                return <LLMModelsPanel />
            case 'Integrations':
                return <IntegrationsPanel />
            case 'Data Sources':
                return <DataSourcesPanel />
            case 'Prompts':
                return <PromptsPanel />
            case 'Tools':
                return <ToolsPanel />
            case 'Memory/Context':
                return <MemoryContextPanel />
            case 'Sampling':
                return <SamplingPanel />
            case 'Security':
                return <SecurityPanel />
            case 'Logs':
                return <LogsPanel />
            default:
                return null
        }
    }, [selected])

    return (
        <div
            className="
                w-[350px] h-[575px] p-4 overflow-hidden
                rounded-2xl bg-[#1f1f2d]/60 backdrop-blur-md
                border border-white/10 shadow-sm text-white
                flex flex-col space-y-4
            "
            onKeyDown={onKeyNav}
        >
            <div className="flex items-center gap-2 font-semibold text-white">
                <Settings className="w-4 h-4 text-white/70" />
                MCP 설정
            </div>

            <div
                role="tablist"
                aria-label="MCP 설정 탭"
                className="flex flex-wrap gap-2"
            >
                {tabs.map((tab) => {
                    const active = selected === tab
                    return (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => setSelected(tab)}
                            className={[
                                'px-3 py-1 rounded-md text-[11px] font-medium transition-all ring-1',
                                active
                                    ? 'bg-indigo-500/10 text-indigo-300 ring-indigo-400/30 shadow-[0_6px_20px_-6px_rgba(99,102,241,0.5)]'
                                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 ring-white/10',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50',
                            ].join(' ')}
                        >
                            {tab}
                        </button>
                    )
                })}
            </div>

            <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selected}
                        initial={{ opacity: 0, x: 30, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className="
                            absolute inset-0
                            scrollLLMArea overflow-y-auto overflow-x-auto pl-1 pr-2
                            text-sm text-white/80
                        "
                    >
                        {content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
