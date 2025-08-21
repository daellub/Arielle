// app/dashboard/components/MicroControlDock.tsx
'use client'

import { useMemo, useState, useCallback } from 'react'
import { Settings, Cpu, PlugZap, DatabaseZap, Wand2, MemoryStick, SlidersHorizontal, Shield } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'

const tabs = [
    { key: 'models', label: '모델', icon: <Cpu className="w-3.5 h-3.5" /> },
    { key: 'integrations', label: '연동', icon: <PlugZap className="w-3.5 h-3.5" /> },
    { key: 'sources', label: '데이터', icon: <DatabaseZap className="w-3.5 h-3.5" /> },
    { key: 'prompts', label: '프롬프트', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { key: 'memory', label: '메모리', icon: <MemoryStick className="w-3.5 h-3.5" /> },
    { key: 'sampling', label: '샘플링', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { key: 'security', label: '보안', icon: <Shield className="w-3.5 h-3.5" /> },
] as const
type TabKey = typeof tabs[number]['key']

export default function MicroControlDock() {
    const [selected, setSelected] = useState<TabKey>('models')

    const content = useMemo(() => {
        switch (selected) {
            case 'models': return <Stub text="모델 설정 (선택/활성/엔드포인트)" />
            case 'integrations': return <Stub text="외부 서비스 연동 (토글/상태)" />
            case 'sources': return <Stub text="데이터 소스 연결/동기화" />
            case 'prompts': return <Stub text="시스템/컨텍스트 프롬프트 관리" />
            case 'memory': return <Stub text="메모리 전략 · 윈도/요약/하이브리드" />
            case 'sampling': return <Stub text="온도 · top-k · top-p · penalty" />
            case 'security': return <Stub text="API Key · Rate Limit · JWT" />
        }
    }, [selected])

    const onKeyNav = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const i = tabs.findIndex(t => t.key === selected)
        const next = e.key === 'ArrowRight'
            ? tabs[(i + 1) % tabs.length]
            : tabs[(i - 1 + tabs.length) % tabs.length]
        setSelected(next.key)
    }, [selected])

    return (
        <div
            className="
                w-full h-[580px] p-3 overflow-hidden
                rounded-xl bg-white/5 backdrop-blur-md
                border border-white/10 shadow-sm text-white
                flex flex-col space-y-3
            "
            onKeyDown={onKeyNav}
        >
            <div className="flex items-center gap-2 text-white/85 font-semibold">
                <Settings className="w-4 h-4 text-white/70" />
                빠른 설정
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((t) => {
                    const active = selected === t.key
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => setSelected(t.key)}
                            className={clsx(
                                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ring-1 inline-flex items-center gap-1.5',
                                active
                                    ? 'bg-white text-[#1d2a55] ring-white shadow-[0_6px_20px_-6px_rgba(255,255,255,0.65)]'
                                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 ring-white/10'
                            )}
                        >
                            {t.icon}{t.label}
                        </button>
                    )
                })}
            </div>

            <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selected}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className="absolute inset-0 overflow-auto pr-1 text-sm text-white/85"
                    >
                        {content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

function Stub({ text }: { text: string }) {
    return (
        <div className="grid place-items-center h-full text-white/70">
            <div className="text-center">
                <div className="text-base font-semibold">{text}</div>
                <div className="text-xs mt-1 text-white/50">※ API 연동/스토어 바인딩은 이후 단계에서 붙입니다.</div>
            </div>
        </div>
    )
}
