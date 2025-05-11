'use client'

import { useEffect, useState } from 'react'
import { WandSparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import ChatBubbleList from '@/app/llm/features/components/ChatBubbleList'
import CharacterStatusCard from '@/app/llm/features/components/CharacterStatusCard'
import LLMSystemStats from '@/app/llm/features/components/LLMStatusCard'
import SectionTimerCard from '@/app/llm/features/components/SectionTimerCard'
import MCPPanel from '@/app/llm/features/components/MCPPanel'

interface Sparkle {
    top: string
    left: string
    delay: string
    duration: string
}

export default function LLMPage() {
    const [sparkles, setSparkles] = useState<Sparkle[]>([])
    const tabs: ('원어' | '번역')[] = ['원어', '번역']
    const [langTab, setLangTab] = useState<'원어' | '번역'>('원어')

    useEffect(() => {
        const generated = Array.from({ length: 20 }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${3 + Math.random() * 2}s`,
        }))
        setSparkles(generated)
    }, [])

    return (
        // <div className="min-h-screen relative bg-gradient-to-br from-[#0f0f1c] to-[#1a1a2e] text-white">
        <div className="w-full h-full text-white">
            <div className="fixed top-[-50px] right-[-100px] w-[500px] h-[500px] bg-[#a49aff] rounded-full blur-[180px] opacity-20 z-0" />
            <div className="fixed bottom-[-80px] left-[-120px] w-[300px] h-[300px] bg-[#c8b9ff] rounded-full blur-[150px] opacity-10 z-0" />

            {sparkles.map((s, i) => (
                <div
                    key={i}
                    className="absolute w-[6px] h-[6px] rounded-full bg-white/30 blur-[2px] animate-ping z-0"
                    style={{
                        top: s.top,
                        left: s.left,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                    }}
                />
            ))}

            <div className="relative z-10 max-w-screen-xl mx-auto px-20 py-12 space-y-10">
                <div className="flex items-center gap-3 mb-4">
                    <WandSparkles className="w-6 h-6 text-[#4f83ff] drop-shadow" />
                    <h1 className="text-3xl font-bold text-[#b0caff] tracking-wide drop-shadow-sm">
                        Arielle <span className="font-light text-[#6f84a8]">Dialogue Panel</span>
                    </h1>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-3 flex flex-col justify-between space-y-6 h-[80vh]">
                        <div className="grid grid-cols-1 gap-4">
                            <CharacterStatusCard />
                            <LLMSystemStats
                                modelName="pantheon-rp-1.8-Q6_K"
                                maxTokens={512}
                                temperature={0.7}
                                topP={0.9}
                                topK={40}
                                repetitionPenalty={1.1}
                                responseTime={1.2}
                                device="Intel AI Boost NPU"
                            />
                            <SectionTimerCard />
                        </div>
                    </div>
                    <div className="
                        col-span-6 relative
                        h-[calc(100vh-180px)]
                        bg-white/5 opacity-60 hover:opacity-75 backdrop-blur-xl
                        border border-white/10 rounded-[28px]
                        shadow-[0_8px_32px_rgba(255,255,255,0.05)]
                        p-8 flex flex-col justify-end transition-all
                    ">
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
                                />
                                {tabs.map((label) => (
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

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={langTab}
                                initial={{ opacity: 0, x: langTab === '원어' ? -30 : 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: langTab === '원어' ? 30 : -30 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="overflow-hidden"
                            >
                                <ChatBubbleList language={langTab === '원어' ? 'en' : 'ko'} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <MCPPanel />
                </div>
            </div>
        </div>
    )
}
