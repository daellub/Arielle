// app/pages/HomePage.tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
    SlidersHorizontal,
    ArrowRight,
    Sparkles,
    Wand2,
    MessageSquare,
    Headphones,
    ChevronRight,
    ShieldEllipsis,
    LayoutDashboard
} from 'lucide-react'
import HandwriteAnim from '../home/HandwriteAnim'

const HomeDetail = dynamic(() => import('./HomeDetail'), {
    ssr: false,
    // loading: () => <div className="p-6 text-white/60">Loading...</div>,
})

const INTRO_MS = 3000 // 손글씨 애니메이션 재생 시간

export default function HomePage({ selectedTab }: { selectedTab: string }) {
    const [showDetail, setShowDetail] = useState(false)
    const isVisible = selectedTab === 'Home'
    const prevVisible = useRef(true)

    const [showIntro, setShowIntro] = useState(false)
    const introTimer = useRef<number | null>(null)

    useEffect(() => {
        if (prevVisible.current && !isVisible) {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'auto' })
            })
        }
        prevVisible.current = isVisible
    }, [isVisible])

    useEffect(() => {
        if (!isVisible) return
        try {
            const seen = sessionStorage.getItem('home:introSeen')
            const prefersReduced =
                typeof window !== 'undefined' &&
                window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches

            if (!seen) {
                setShowIntro(true)
                const ms = prefersReduced ? 600 : INTRO_MS
                introTimer.current = window.setTimeout(() => {
                    setShowIntro(false)
                    sessionStorage.setItem('home:introSeen', '1')
                }, ms)
            }
        } catch {
            setShowIntro(false)
        }
        return () => {
            if (introTimer.current) window.clearTimeout(introTimer.current)
        }
    }, [isVisible])

    const skipIntro = () => {
        if (!showIntro) return
        setShowIntro(false)
        try {
            sessionStorage.setItem('home:introSeen', '1')
        } catch {}
        if (introTimer.current) window.clearTimeout(introTimer.current)
    }

    // 키보드 이벤트 리스너 등록 (엔터 / E -> 디테일, ESC -> 닫기)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!isVisible) return
            if (showIntro) {
                if (e.key === 'Enter' || e.key === 'Escape' || e.key.toLowerCase() === 'd') {
                    skipIntro()
                }
                return
            }
            if ((e.key === 'Enter' || e.key.toLowerCase() === 'd') && !showDetail) setShowDetail(true)
            if (e.key === 'Escape' && showDetail) setShowDetail(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isVisible, showDetail, showIntro])

    return (
        <div
            className="
                w-full h-full flex flex-col overflow-hidden relative
                bg-gradient-to-br from-[#e1edf6] to-[#abc0f6]
                dark:from-[#0e1220] dark:to-[#151b2e]
            "
        >
            <AnimatePresence initial>
                {showIntro && (
                    <motion.div
                        key="home-intro"
                        className="
                            absolute inset-0 z-[50] flex items-center justify-center
                            bg-gradient-to-br from-[#e1edf6] to-[#abc0f6]
                            dark:from-[#0e1220] dark:to-[#151b2e]
                            cursor-pointer
                        "
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        onClick={skipIntro}
                        aria-label="인트로 - 클릭 또는 Enter로 계속"
                    >
                        <div className="w-full h-full pointer-events-none select-none relative">
                            <HandwriteAnim />
                        </div>
                        <span className="absolute bottom-6 right-6 text-xs text-gray-700/70 dark:text-white/70 pointer-events-none">
                            클릭/Enter로 계속
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="
                    absolute inset-0 z-[0] pointer-events-none select-none
                    mix-blend-multiply dark:mix-blend-screen
                "
            >
                <HandwriteAnim />
            </div>

            <div
                aria-hidden
                className="
                    pointer-events-none absolute -top-28 -right-24 w-[520px] h-[520px]
                    rounded-full blur-[180px] opacity-25
                    bg-[#a49aff] dark:bg-[#6a63ff]/60 z-[0]
                "
            />
            <div
                aria-hidden
                className="
                    pointer-events-none absolute -bottom-28 -left-24 w-[360px] h-[360px]
                    rounded-full blur-[160px] opacity-20
                    bg-[#c8b9ff] dark:bg-[#4c5b8a]/60 z-[0]
                "
            />

            <motion.div
                key="home-content"
                className={isVisible ? 'flex-1 overflow-hidden relative z-[2]' : 'hidden'}
                initial={{ opacity: 0 }}
                animate={{ opacity: showIntro ? 0 : 1 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: showIntro ? 0 : 0.05 }}
                aria-hidden={showIntro}
            >
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
                            className="absolute inset-0 h-full flex items-center justify-center px-6 md:px-12"
                        >
                            <div
                                className="
                                    w-full max-w-5xl rounded-2xl p-8 md:p-12
                                    bg-white/60 dark:bg-white/5
                                    ring-1 ring-black/10 dark:ring-white/10
                                    backdrop-blur-md
                                    shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)]
                                "
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-white/70" />
                                    <span className="text-[15px] tracking-tight font-light text-gray-500 dark:text-white">
                                        Multimodal Control Panel
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-omyu_pretty font-extrabold text-gray-900 dark:text-white leading-tight">
                                    Connect with{' '}
                                    <span className="font-omyu_pretty bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
                                        Arielle
                                    </span>
                                </h1>
                                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                                    텍스트·음성 멀티모달 워크플로우
                                </p>

                                <div className="mt-7 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        aria-label="디테일 열기"
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

                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setShowDetail(true) }}
                                        className="
                                            inline-flex items-center gap-2
                                            px-4 py-2.5 rounded-xl text-sm
                                            bg-white/70 dark:bg-white/5
                                            text-gray-800 dark:text-white/80
                                            ring-1 ring-black/10 dark:ring-white/10
                                            hover:bg-white/90 dark:hover:bg-white/10
                                            transition
                                            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
                                        "
                                    >
                                        둘러보기
                                    </a>

                                    <span className="ml-auto text-[11px] text-gray-600 dark:text-white/50">
                                        단축키: <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">Enter</kbd> /{' '}
                                        <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">D</kbd> 열기 ·{' '}
                                        <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">Esc</kbd> 닫기
                                    </span>
                                </div>

                                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <FeatureCard
                                        icon={<LayoutDashboard className="w-4 h-4" />}
                                        title="Dashboard"
                                        desc="리소스 사용량, 지연 시간, 로그를 모니터링하세요."
                                        onClick={() => setShowDetail(true)}
                                    />
                                    <FeatureCard
                                        icon={<ShieldEllipsis className="w-4 h-4" />}
                                        title="Security"
                                        desc="권한과 보안을 한곳에서 관리하세요."
                                        onClick={() => setShowDetail(true)}
                                    />
                                    <FeatureCard
                                        icon={<Headphones className="w-4 h-4" />}
                                        title="Text-to-Speech"
                                        desc="텍스트를 자연스러운 음성으로 변환하세요."
                                        onClick={() => setShowDetail(true)}
                                    />
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <QuickLink text="데이터베이스 보기" onClick={() => setShowDetail(true)} />
                                    <QuickLink text="모델/툴 구성 바로가기" onClick={() => setShowDetail(true)} />
                                    <QuickLink text="깃허브 레포지토리 열기" onClick={() => setShowDetail(true)} />
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    desc,
    onClick
}: {
    icon: React.ReactNode
    title: string
    desc: string
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="
                text-left rounded-2xl p-4 ring-1 transition
                bg-white/60 dark:bg-white/5
                ring-black/10 dark:ring-white/10
                hover:bg-white/80 dark:hover:bg-white/10
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
            "
        >
            <div className="flex items-start gap-2">
                <div className="shrink-0 text-gray-800 dark:text-white/80">{icon}</div>
                <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{title}</div>
                    <div className="text-[12px] text-gray-700 dark:text-white/70">{desc}</div>
                </div>
            </div>
        </button>
    )
}

function QuickLink({ text, onClick }: { text: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="
                w-full inline-flex items-center justify-between gap-2
                rounded-xl px-3 py-2 text-sm
                bg-white/60 dark:bg-white/5
                text-gray-900 dark:text-white/80
                ring-1 ring-black/10 dark:ring-white/10
                hover:bg-white/80 dark:hover:bg-white/10
                transition
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
            "
        >
            <span className="truncate">{text}</span>
            <ChevronRight className="w-4 h-4" />
        </button>
    )
}