// app/pages/HomePage.tsx
'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
    SlidersHorizontal,
    Save,
    RefreshCw,
    ArrowRight,
    Cpu
} from 'lucide-react'

const HomeDetail = dynamic(() => import('./HomeDetail'), {
    ssr: false,
    // loading: () => <div className="p-6 text-white/60">Loading...</div>,
})

export default function HomePage({ selectedTab }: { selectedTab: string }) {
    const [showDetail, setShowDetail] = useState(false)
    const isVisible = selectedTab === 'Home'
    const prevVisible = useRef(true)

    useEffect(() => {
        if (prevVisible.current && !isVisible) {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'auto' })
            })
        }
        prevVisible.current = isVisible
    }, [isVisible])

    return (
        <div
            className="
                w-full h-full flex flex-col overflow-hidden relative
                bg-gradient-to-br from-[#e1edf6] to-[#abc0f6]
                dark:from-[#0e1220] dark:to-[#151b2e]
            "
        >
            <div
                aria-hidden
                className="
                    pointer-events-none absolute -top-28 -right-24 w-[520px] h-[520px]
                    rounded-full blur-[180px] opacity-25
                    bg-[#a49aff] dark:bg-[#6a63ff]/60
                "
            />
            <div
                aria-hidden
                className="
                    pointer-events-none absolute -bottom-28 -left-24 w-[360px] h-[360px]
                    rounded-full blur-[160px] opacity-20
                    bg-[#c8b9ff] dark:bg-[#4c5b8a]/60
                "
            />

            <div className={isVisible ? 'flex-1 overflow-hidden relative' : 'hidden'}>
                <AnimatePresence mode="wait" initial={false}>
                    {showDetail ? (
                        <motion.div
                            key="detail"
                            className="absolute inset-0 h-full"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 24 }}
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                        >
                            <HomeDetail onBack={() => setShowDetail(false)} />
                        </motion.div>
                    ) : (
                        <motion.section
                            key="hero"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="
                                absolute inset-0 h-full
                                flex items-center justify-center
                                px-10 md:px-20
                            "
                        >
                            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                <div
                                    className="
                                        rounded-2xl p-6 md:p-8
                                        bg-white/50 dark:bg-white/5
                                        ring-1 ring-black/10 dark:ring-white/10
                                        backdrop-blur-xl
                                        shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)]
                                        transition
                                    "
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-white/70" />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                            Arielle — Multimodal Companion
                                        </span>
                                    </div>

                                    <h1
                                        className="
                                            text-3xl md:text-4xl font-extrabold tracking-tight
                                            text-gray-900 dark:text-white
                                        "
                                    >
                                        Project{' '}
                                        <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
                                            Arielle
                                        </span>
                                    </h1>

                                    <p className="mt-3 text-xs md:text-base text-gray-700 dark:text-gray-300">
                                        AI 멀티모달 프로젝트
                                    </p>

                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        ASR → 번역 → LLM → TTS → VRM
                                    </p>

                                    <div className="mt-6 flex items-center gap-3">
                                        <button
                                            type="button"
                                            aria-label="프로젝트 시작하기"
                                            onClick={() => setShowDetail(true)}
                                            className="
                                                inline-flex items-center justify-center gap-2
                                                px-5 py-3 rounded-xl font-medium
                                                bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white
                                                ring-1 ring-indigo-300/40
                                                hover:from-indigo-400 hover:to-fuchsia-400
                                                active:scale-[0.99]
                                                shadow-[0_10px_30px_-12px_rgba(99,102,241,0.6)]
                                                transition
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                                                focus-visible:ring-indigo-400
                                                dark:focus-visible:ring-offset-transparent
                                            "
                                        >
                                            시작하기
                                            <ArrowRight className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            aria-label="개요 새로고침"
                                            className="
                                                inline-flex items-center gap-2
                                                px-4 py-2.5 rounded-xl text-sm
                                                bg-white/60 dark:bg-white/5
                                                text-gray-800 dark:text-white/80
                                                ring-1 ring-black/10 dark:ring-white/10
                                                hover:bg-white/80 dark:hover:bg-white/10
                                                transition
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
                                            "
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            개요 보기
                                        </button>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div
                                            className="
                                                rounded-xl p-3 bg-white/50 dark:bg-white/5
                                                ring-1 ring-black/10 dark:ring-white/10
                                                flex items-center justify-between
                                            "
                                        >
                                            <div className="text-xs text-gray-600 dark:text-white/60">
                                                상태
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                Idle
                                            </div>
                                        </div>
                                        <div
                                            className="
                                                rounded-xl p-3 bg-white/50 dark:bg-white/5
                                                ring-1 ring-black/10 dark:ring-white/10
                                                flex items-center justify-between
                                            "
                                        >
                                            <div className="text-xs text-gray-600 dark:text-white/60">
                                                파이프라인
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                5 stages
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div
                                        className="
                                            rounded-2xl p-5 md:p-6
                                            bg-white/50 dark:bg-white/5
                                            ring-1 ring-black/10 dark:ring-white/10
                                            backdrop-blur-xl
                                        "
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <Cpu className="w-5 h-5 text-gray-700 dark:text-white/70" />
                                            <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                                빠른 시작
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                className="
                                                    group rounded-xl px-4 py-3 text-left
                                                    bg-white/70 dark:bg-white/5
                                                    ring-1 ring-black/10 dark:ring-white/10
                                                    hover:bg-white/90 dark:hover:bg-white/10
                                                    transition
                                                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
                                                "
                                                onClick={() => setShowDetail(true)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        파이프라인 살펴보기
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-gray-600 dark:text-white/60" />
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-600 dark:text-white/60">
                                                    ASR→LLM→TTS→VRM 순서
                                                </div>
                                            </button>

                                            <button
                                                className="
                                                    group rounded-xl px-4 py-3 text-left
                                                    bg-white/70 dark:bg-white/5
                                                    ring-1 ring-black/10 dark:ring-white/10
                                                    hover:bg-white/90 dark:hover:bg-white/10
                                                    transition
                                                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
                                                "
                                                onClick={() => alert('샘플 프로젝트 준비 중')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        샘플 실행
                                                    </span>
                                                    <Save className="w-4 h-4 text-gray-600 dark:text-white/60" />
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-600 dark:text-white/60">
                                                    데모 프리셋으로 시작
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        className="
                                            rounded-2xl p-5 md:p-6
                                            bg-white/50 dark:bg-white/5
                                            ring-1 ring-black/10 dark:ring-white/10
                                            backdrop-blur-xl
                                        "
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-white/70" />
                                            <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                                프리셋
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {['Balanced', 'Creative', 'Precise'].map((p) => (
                                                <button
                                                    key={p}
                                                    className="
                                                        rounded-xl px-3 py-2 text-sm
                                                        bg-white/70 dark:bg-white/5
                                                        text-gray-900 dark:text-white/80
                                                        ring-1 ring-black/10 dark:ring-white/10
                                                        hover:bg-white/90 dark:hover:bg-white/10
                                                        transition
                                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
                                                    "
                                                    onClick={() => setShowDetail(true)}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
