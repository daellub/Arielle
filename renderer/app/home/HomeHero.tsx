// app/home/HomeHero.tsx
/**
 * Arielle 프로젝트의 실험 버전으로 개발 중인 테마 기능입니다.
 */
'use client'
import { motion } from 'motion/react'
import clsx from 'clsx'

export default function HomeHero() {
    return (
        <div className="relative min-h-screen flex items-center justify-center">
            {/* <div
                className={clsx(
                    'relative w-[min(1100px,92vw)] aspect-[16/7] rounded-[28px] overflow-hidden',
                    'border border-white/12 bg-white/[0.03]'
                )}
                style={{
                    boxShadow: '0 35px 140px rgba(60,120,200,0.25)',
                    backdropFilter: 'blur(2px)',
                }}
            > */}
                {/* <div className="absolute inset-0 ocean-glass" />

                <div className="absolute left-6 top-5 text-white/60 text-xs tracking-[0.22em]">
                    ARIELLE CONTROL • SURFACE (NIGHT)
                </div>

                <div className="absolute inset-0 flex items-center justify-center text-center px-10">
                    <div>
                        <h1
                            className="text-4xl md:text-6xl font-light text-white/95"
                            style={{ textShadow: '0 0 28px rgba(160,200,255,0.25)' }}
                        >
                            Quiet Surface, Bright Signals
                        </h1>
                        <p className="mt-4 text-white/70">
                            상태 요약 · 최근 이벤트 · 진입점
                        </p>
                    </div>
                </div>

                <div className="absolute left-0 right-0 bottom-0 p-4">
                    <div className="grid grid-cols-3 gap-3">
                        {['ASR', 'LLM', 'TTS'].map((k, i) => (
                            <motion.div
                                key={k}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.08 * i }}
                                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/85"
                                style={{ boxShadow: '0 10px 34px rgba(120,170,255,0.18)' }}
                            >
                                <div className="text-[11px] opacity-70">Service</div>
                                <div className="text-base">{k}</div>
                                <div className="text-[11px] opacity-60 mt-1">OK • latency —</div>
                            </motion.div>
                        ))}
                    </div>
                </div> */}

                {/* <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/10" />
                <div className="pointer-events-none absolute inset-0 rounded-[28px] ocean-edge-light" />
            </div> */}
        </div>
    )
}
