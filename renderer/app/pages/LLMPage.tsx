// app/pages/LLMPage.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { shallow } from 'zustand/shallow'
import clsx from 'clsx'

import ChatBubbleList from '@/app/llm/features/components/ChatBubbleList'
import CharacterStatusCard from '@/app/llm/features/components/CharacterStatusCard'
import LLMSystemStats from '@/app/llm/features/components/LLMStatusCard'
import SectionTimerCard from '@/app/llm/features/components/SectionTimerCard'
import MCPPanel from '@/app/llm/features/components/MCPPanel'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'
import LLMDebugInputPanel from '../llm/features/components/LLMDebugInputPanel'

import styles from './LLMPage.module.css'

type LangTab = '원어' | '번역'
const TABS: LangTab[] = ['원어', '번역']

interface Sparkle {
    top: string
    left: string
    delay: string
    duration: string
}

export default function LLMPage() {
    const [last, setLast] = useState({
        emotion: 'neutral',
        tone: '정중체',
        blendshape: 'Neutral',
    })
    const [langTab, setLangTab] = useState<LangTab>('원어')
    
    useEffect(() => {
        const unsub = useLLMStore.subscribe(
            (s) => {
                const arr = s.messages
                for (let i = arr.length - 1; i >= 0; i--) {
                    const m = arr[i]
                    if (m.role === 'assistant' && m.isFinal) {
                        return [
                            m.emotion ?? 'neutral',
                            m.tone ?? '정중체',
                            m.blendshape ?? 'Neutral',
                        ] as const
                    }
                }
                return null
            },
            (triple) => {
                if (triple) {
                    setLast({
                        emotion: triple[0],
                        tone: triple[1],
                        blendshape: triple[2],
                    })
                }
            },
            { equalityFn: shallow }
        )
        return unsub
    }, [])

    const sparkles = useMemo<Sparkle[]>(
        () =>
            Array.from({ length: 12 }, () => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 6}s`,
                duration: `${3 + Math.random() * 3}s`,
            })),
        []
    )

    return (
        <div className={clsx(styles.container, 'text-white [isolation:isolate]')}>
            <div className={styles.bgHalo} aria-hidden />
            <div className={styles.auroraArc} aria-hidden />
            <div className={styles.gridOverlay} aria-hidden />

            {sparkles.map((s, i) => (
                <div
                    key={i}
                    className={styles.sparkle}
                    style={{
                        top: s.top,
                        left: s.left,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)'
                    }}
                    aria-hidden
                />
            ))}

            <div className="flex-1 overflow-hidden relative z-10 min-h-0">
                <div className="max-w-screen-xl mx-auto px-20 py-12 space-y-10">
                    <div className="flex items-center gap-3 mb-4">
                        <CommandIcon className="w-8 h-8 text-white/80" />
                        <h1 className="text-3xl font-bold font-QuietlyRose text-[#b0caff] tracking-wide drop-shadow-sm">
                            LLM <span className="font-QuietlyRose text-[#6f84a8]">Control Panel</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-3 flex flex-col justify-between space-y-6 h-[80vh] min-h-0">
                            <div className="grid grid-cols-1 gap-4 min-h-0">
                                <CharacterStatusCard
                                    emotion={last.emotion}
                                    tone={last.tone}
                                    blendshape={last.blendshape}
                                />
                                <LLMSystemStats />
                                <SectionTimerCard />
                            </div>
                        </div>

                        <div
                            className={clsx(
                                'col-span-6 relative h-[calc(100vh-180px)] min-h-0 p-8',
                                'grid grid-rows-[1fr_auto] gap-3',
                                styles.glass,
                                styles.mainPanel
                            )}
                        >
                            <div className="absolute -top-5 right-5 z-10">
                                <div className={clsx('relative flex rounded-full p-1 w-fit', styles.tabShell)}>
                                    <motion.div
                                        layout
                                        layoutId="tab-highlight"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className={styles.tabHighlight}
                                        style={{ left: langTab === '원어' ? '0%' : '50%' }}
                                    />
                                    {TABS.map((label) => (
                                        <button
                                            key={label}
                                            onClick={() => setLangTab(label)}
                                            className={clsx(
                                                'relative z-10 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors',
                                                langTab === label ? styles.tabActive : styles.tabIdle
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div className={clsx('scrollLLMArea flex-1 min-h-0 w-full overflow-y-auto', styles.chatScroll)}>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={langTab}
                                        initial={{ opacity: 0, x: langTab === '원어' ? -30 : 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: langTab === '원어' ? 30 : -30 }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className="h-full"
                                    >
                                        <ChatBubbleList language={langTab === '원어' ? 'en' : 'ko'} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
 
                            <LLMDebugInputPanel />
                        </div>

                        <div className='col-span-3 min-h-0'>
                            <div className={styles.mcpSkeleton}>
                                <MCPPanel />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
