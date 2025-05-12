// app/AppContainer.tsx
'use client'

import { useTabStore } from '@/app/store/tabStore'
import Sidebar from './components/ui/Sidebar'
import HomePage from './pages/HomePage'
import ASRPage from './pages/ASRPage'
import TranslatePage from './pages/TranslatePage'
import LLMPage from './pages/LLMPage'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

const tabBackgrounds: Record<string, string> = {
    Home: '#ffffff',
    ASR: '#ffffff',
    Translate: '#ffffff',
    LLM: 'linear-gradient(to bottom right, #0f0f1c, #1a1a2e)',
}

export default function AppContainer() {
    const selectedTab = useTabStore((state) => state.selectedTab)
    const setSelectedTab = useTabStore((state) => state.setSelectedTab)
    const prevTab = useRef<string>(selectedTab)

    return (
        <div className="flex h-screen overflow-hidden bg-transparent relative">
            <Sidebar selected={selectedTab} onSelect={setSelectedTab} />
            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedTab + '-bg'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 z-0 overflow-hidden"
                        style={{
                        background: tabBackgrounds[selectedTab],
                        willChange: 'opacity',
                        }}
                    />
                </AnimatePresence>

                <div className="absolute inset-0 z-10">
                    {[
                        { key: 'Home', Component: () => <HomePage selectedTab={selectedTab} />},
                        { key: 'ASR', Component: ASRPage },
                        { key: 'Translate', Component: TranslatePage },
                        { key: 'LLM', Component: LLMPage },
                    ].map(({ key, Component }) => (
                        <motion.div
                            key={key}
                            initial={false}
                            animate={{
                                opacity: selectedTab === key ? 1 : 0,
                                scale: selectedTab === key ? 1 : 0.98,
                                pointerEvents: selectedTab === key ? 'auto' : 'none',
                            }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 w-full h-full"
                            style={{ willChange: 'opacity, transform' }}
                        >
                            <Component />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
