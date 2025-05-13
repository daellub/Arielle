'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import HomeDetail from './HomeDetail'

export default function HomePage({ selectedTab }: { selectedTab: string }) {
    const [showDetail, setShowDetail] = useState(false)
    const isVisible = selectedTab === 'Home'
    const prevVisible = useRef(true)

    useEffect(() => {
        if (prevVisible.current && !isVisible) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'auto' })
            }, 50)
        }
        prevVisible.current = isVisible
    }, [isVisible])

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-[#f6f7fb] relative">
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {showDetail ? (
                        <motion.div key="detail" className="absolute inset-0">
                            <HomeDetail onBack={() => setShowDetail(false)} />
                        </motion.div>
                    ) : (
                        <motion.section
                            key="hero"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 items-center px-60 py-20"
                        >
                            <div className="space-y-4">
                                <h1 className="text-5xl font-bold text-gray-900">Project Arielle</h1>
                                <p className="text-lg text-gray-700">AI 멀티모달 프로젝트</p>
                                <p className="text-sm text-gray-500">ASR → 번역 → LLM → TTS → VRM</p>
                                <button
                                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] transition"
                                    onClick={() => setShowDetail(true)}
                                >
                                    시작하기 →
                                </button>
                            </div>
                            <div className="flex justify-center">
                                {/* <Image
                                    src="/assets/arielle.png"
                                    alt="Arielle Character"
                                    width={320}
                                    height={480}
                                    className="rounded-2xl shadow-2xl object-cover"
                                /> */}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
