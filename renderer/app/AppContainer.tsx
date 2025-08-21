// app/AppContainer.tsx
'use client'

import { useTabStore } from '@/app/store/tabStore'
import Sidebar from './components/ui/Sidebar'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'

const tabBackgrounds: Record<string, string> = {
    Home: '#ffffff',
    ASR: '#ffffff',
    Translate: '#ffffff',
    LLM: 'linear-gradient(to bottom right, #0f0f1c, #1a1a2e)',
}

export default function AppContainer() {
    const selectedTab = useTabStore((state) => state.selectedTab)
    const pageCache = useRef<Record<string, React.ReactElement>>({})
    const getCached = (key: string, el: React.ReactElement) => {
        if (!pageCache.current[key]) pageCache.current[key] = el
        return pageCache.current[key]
    }
    const setSelectedTab = useTabStore((state) => state.setSelectedTab)
    const prevTab = useRef<string>(selectedTab)

    const HomePage = dynamic(() => import('./pages/HomePage'), { ssr: false })
    const DashboardPage = dynamic(() => import('./pages/DashboardPage'), { ssr: false })
    const ASRPage = dynamic(() => import('./pages/ASRPage'), { ssr: false })
    const TranslatePage = dynamic(() => import('./pages/TranslatePage'), { ssr: false })
    const LLMPage = dynamic(() => import('./pages/LLMPage'), { ssr: false })
    const TTSPage = dynamic(() => import('./pages/TTSPage'), { ssr: false })
    const VRMPage = dynamic(() => import('./pages/VRMPage'), { ssr: false })

    return (
        <div className="flex h-screen overflow-hidden bg-transparent relative">
            <Sidebar selected={selectedTab} onSelect={setSelectedTab} />
            <div className="flex-1 relative">
                <AnimatePresence mode="wait" initial={false}>
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
                        { key: 'Home', node: getCached('Home', <HomePage selectedTab={selectedTab} />) },
                        { key: 'Dashboard', node: getCached('Dashboard', <DashboardPage />) },
                        { key: 'ASR', node: getCached('ASR', <ASRPage />) },
                        { key: 'Translate', node: getCached('Translate', <TranslatePage />) },
                        { key: 'LLM', node: getCached('LLM', <LLMPage />) },
                        { key: 'TTS', node: getCached('TTS', <TTSPage />) },
                        { key: 'VRM', node: getCached('VRM', <VRMPage />) },
                    ].map(({ key, node }) => {
                        const active = selectedTab === key
                        return (
                            <motion.div
                                key={key}
                                initial={false}
                                animate={{
                                    opacity: active ? 1 : 0,
                                    scale: active ? 1 : 0.985,
                                }}
                                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                className='absolute inset-0 w-full h-full'
                                style={{
                                    pointerEvents: active ? 'auto' : 'none',
                                    willChange: active ? 'opacity, transform' : 'auto',
                                }}
                            >
                                {node}
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
