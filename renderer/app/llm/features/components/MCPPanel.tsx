// app/llm/features/components/MCPPanel.tsx
'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import IntegrationsPanel from './mcp/IntegrationsPanel'
import DataSourcesPanel from './mcp/DataSourcesPanel'
import PromptsPanel from './mcp/PromptsPanels'
import ToolsPanel from './mcp/ToolsPanel'
import MemoryContextPanel from './mcp/MemoryContextPanel'
import SamplingPanel from './mcp/SamplingPanel'
import SecurityPanel from './mcp/SecurityPanel'
import LogsPanel from './mcp/LogPanel'

const tabs = [
    'Integrations', 'Data Sources', 'Prompts', 'Tools',
    'Memory/Context', 'Sampling', 'Security', 'Logs'
]

export default function MCPPanel() {
    const [selected, setSelected] = useState('Integrations')

    return (
        <div className="w-[350px] h-[575px] p-4 rounded-2xl bg-[#1f1f2d]/60 backdrop-blur-md border border-white/10 shadow-sm text-white space-y-4">
            <div className="flex items-center gap-2 font-semibold text-white">
                <Settings className="w-4 h-4 text-white/70" />
                MCP 설정
            </div>

            <div className="flex flex-wrap gap-2">
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

            <div className="text-sm text-white/80 mt-4 relative h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={selected}
                        initial={{ opacity: 0, x: 30, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute inset-0"
                    >
                        {selected === 'Integrations' && <IntegrationsPanel />}
                        {selected === 'Data Sources' && <DataSourcesPanel />}
                        {selected === 'Prompts' && <PromptsPanel />}
                        {selected === 'Tools' && <ToolsPanel />}
                        {selected === 'Memory/Context' && <MemoryContextPanel />}
                        {selected === 'Sampling' && <SamplingPanel />}
                        {selected === 'Security' && <SecurityPanel />}
                        {selected === 'Logs' && <LogsPanel />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
