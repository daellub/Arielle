// app/pages/DashboardPage.tsx
'use client'

import { useEffect, useMemo } from 'react'
import { CommandIcon } from 'lucide-react'
import clsx from 'clsx'

import './DashboardTheme.css'

import TopKpis from '@/app/dashboard/components/TopKpis'
import ModuleHealth from '@/app/dashboard/components/ModuleHealth'
import ResourcePanel from '@/app/dashboard/components/ResourcePanel'
import LatencyBreakdown from '@/app/dashboard/components/LatencyBreakdown'
import LogHub from '@/app/dashboard/components/LogHub'
import ControlPanel from '@/app/dashboard/components/ControlPanel'
import PersonaStatusCard from '@/app/dashboard/components/PersonaStatusCard'
import MicroControlDock from '@/app/dashboard/components/MicroControlDock'

import PipelineGlyph from '@/app/dashboard/components/PipelineGlyph'
import WaterfallTrace from '@/app/dashboard/components/WaterfallTrace'
import AlertsTimeline from '@/app/dashboard/components/AlertsTimeline'
import ErrorHighlights from '@/app/dashboard/components/ErrorHighlights'
import type { TraceItem } from '@/app/dashboard/types/trace'

export default function DashboardPage() {
    const logTabs = useMemo(() => ([
        { key: 'asr', label: 'ASR' },
        { key: 'translate', label: '번역' },
        { key: 'llm', label: 'LLM' },
        { key: 'tts', label: 'TTS' },
        { key: 'vrm', label: 'VRM' },
    ]), [])

    const demoTraces: TraceItem[] = [
        {
            id: 'req_001', startedAt: Date.now(), ok: true,
            stages: [
                { name: 'ASR', startMs: 0, endMs: 120, ok: true },
                { name: 'TRANSLATE', startMs: 120, endMs: 175, ok: true },
                { name: 'LLM', startMs: 175, endMs: 560, ok: true },
                { name: 'TTS', startMs: 560, endMs: 820, ok: true },
                { name: 'VRM', startMs: 560, endMs: 640, ok: true },
            ]
        },
        {
            id: 'req_002', startedAt: Date.now(), ok: false,
            stages: [
                { name: 'ASR', startMs: 0, endMs: 110, ok: true },
                { name: 'TRANSLATE', startMs: 110, endMs: 160, ok: true },
                { name: 'LLM', startMs: 160, endMs: 900, ok: false },
                { name: 'TTS', startMs: 900, endMs: 1000, ok: true },
                { name: 'VRM', startMs: 900, endMs: 980, ok: true },
            ]
        }
    ]

    useEffect(() => {
        const el = document.querySelector('.scrollDashboardArea')
        if (!el) return
        const onScroll = () => {
            (el as HTMLElement).classList.toggle('is-scrolled', (el as HTMLElement).scrollTop > 6)
        }
        el.addEventListener('scroll', onScroll)
        onScroll() 
        return () => el.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <div className={clsx('dash-root text-white [isolation:isolate]')}>''
            <div className="dash-bgHalo" aria-hidden />
            <div className="dash-auroraArc" aria-hidden />
            <div className="dash-gridOverlay" aria-hidden />
            <div className="dash-noise" aria-hidden />

            <div
                className={clsx(
                    'scrollDashboardArea relative z-10',
                    'h-dvh overflow-y-auto overscroll-contain',
                    'px-6 ml-[100px] pb-24'
                )}
            >
                <header className='dash-toolbar sticky top-[12px] z-20'>
                    <div className='dash-appbar dash-appbar--inset'>
                        <div className='dash-appbar__grid'>
                            <div className='dash-appbar__brand'>
                                <CommandIcon className='w-6 h-6 text-white/85' />
                                <h1 className='text-2xl font-semibold tracking-wide'>
                                    Arielle <span className='text-white/60'>Dashboard</span>
                                </h1>
                            </div>

                            <div className='dash-appbar__controls'>
                                <ControlPanel />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="scrollDashboardArea relative max-w-screen-2xl mx-auto py-6 space-y-6">
                    <PipelineGlyph />

                    <section className="grid grid-cols-12 gap-6 relative">
                        <div className="col-span-12 xl:col-span-9">
                            <div className="card card-elev p-4">
                                <TopKpis />
                            </div>
                        </div>
                        <aside className="col-span-12 xl:col-span-3 space-y-6">
                            <div className="card card-elev p-4">
                                <PersonaStatusCard
                                    avatarSrc="/assets/arielle.png"
                                    name="Arielle"
                                    role="대화 어시스턴트"
                                    emotion="peaceful"
                                    tone="정중체"
                                    blendshape="Neutral"
                                />
                            </div>
                        </aside>
                    </section>

                    <section className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-12 xl:col-span-9 space-y-6">
                            <div className="card card-elev p-4">
                                <WaterfallTrace traces={demoTraces} maxRows={6} />
                            </div>

                            <div className="grid grid-cols-12 gap-6 items-stretch">
                                <div className="col-span-12 xl:col-span-7">
                                    <div className="card card-elev p-4 h-full min-h-[320px]">
                                        <ModuleHealth />
                                    </div>
                                </div>

                                <div className="col-span-12 xl:col-span-5">
                                    <AlertsTimeline />
                                </div>
                            </div>
                        </div>

                        <aside className="col-span-12 xl:col-span-3 space-y-6">
                            <div className="card p-3">
                            <MicroControlDock />
                            </div>
                        </aside>
                    </section>

                    <section className="grid grid-cols-12 gap-6">
                        <div className="col-span-12">
                            <div className="card card-elev p-4">
                                <ResourcePanel />
                            </div>
                        </div>
                    </section>

                    <section className="card card-elev p-4">
                        <LatencyBreakdown />
                    </section>

                    <section className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 2xl:col-span-8">
                            <div className="card p-0">
                                <LogHub tabs={logTabs} />
                            </div>
                        </div>
                        <div className="col-span-12 2xl:col-span-4">
                            <ErrorHighlights />
                        </div>
                    </section>

                    <div className="md:hidden">
                        <div className="card p-3">
                            <ControlPanel />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
