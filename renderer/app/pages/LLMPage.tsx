// app/pages/LLMPage.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { WandSparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { shallow } from 'zustand/shallow'

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
            Array.from({ length: 20 }, () => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 5}s`,
                duration: `${3 + Math.random() * 2}s`,
            })),
        []
    )

    return (
        <div className="w-full h-full flex flex-col overflow-hidden relative text-white">
            <div
                aria-hidden
                className="fixed top-[-50px] right-[-100px] w-[500px] h-[500px] bg-[#a49aff] rounded-full blur-[180px] opacity-20 z-0 pointer-events-none"
            />

            <div
                aria-hidden
                className="fixed bottom-[-80px] left-[-120px] w-[300px] h-[300px] bg-[#c8b9ff] rounded-full blur-[150px] opacity-10 z-0 pointer-events-none"
            />

            {sparkles.map((s, i) => (
                <div
                    key={i}
                    className="absolute w-[6px] h-[6px] rounded-full bg-white/30 blur-[2px] animate-ping z-0 pointer-events-none"
                    style={{
                        top: s.top,
                        left: s.left,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                        willChange: 'transform, opacity',
                        transform: 'translateZ(0)'
                    }}
                />
            ))}

            <div className="flex-1 overflow-y-auto relative z-10 min-h-0">
                <div className="max-w-screen-xl mx-auto px-20 py-12 space-y-10">
                    <div className="flex items-center gap-3 mb-4">
                        <WandSparkles className="w-6 h-6 text-[#4f83ff] drop-shadow" />
                        <h1 className="text-3xl font-bold text-[#b0caff] tracking-wide drop-shadow-sm">
                            Arielle <span className="font-light text-[#6f84a8]">Dialogue Panel</span>
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

                        <div className="col-span-6 relative h-[calc(100vh-180px)]
                            min-h-0 bg-white/5 opacity-60 hover:opacity-75 backdrop-blur-xl
                            border border-white/10 rounded-[28px]
                            shadow-[0_8px_32px_rgba(255,255,255,0.05)]
                            p-8 flex flex-col justify-end transition-all"
                        >
                            <div className="absolute -top-5 right-5 z-10">
                                <div className="relative flex bg-white/10 rounded-full p-1 shadow-inner backdrop-blur-md w-fit">
                                    <motion.div
                                        layout
                                        layoutId="tab-highlight"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className={`
                                            absolute inset-y-0 w-[50%] rounded-full bg-white shadow
                                            ${langTab === '원어' ? 'left-0' : 'left-1/2'}
                                        `}
                                        style={{ willChange: 'transform' }}
                                    />
                                    {TABS.map((label) => (
                                        <button
                                            key={label}
                                            onClick={() => setLangTab(label)}
                                            className={`
                                                relative z-10 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors
                                                ${langTab === label ? 'text-indigo-600' : 'text-white/70'}
                                            `}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className='flex-1 min-h-0 w-full overflow-hidden'>
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
                            <MCPPanel />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
