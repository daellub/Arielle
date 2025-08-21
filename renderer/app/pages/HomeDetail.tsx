// app/pages/HomeDetails.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import axios from 'axios'
import clsx from 'clsx'
import {
    Mic, Volume2, Languages, Brain, User, Database, Bot, ArrowLeft, SlidersHorizontal,
    Sparkles, RefreshCw, Search, Filter, ExternalLink,
    Activity, GitCommitHorizontal, Timer, Server, Gauge, Zap, ShieldCheck
} from 'lucide-react'

type FeedItem = {
    id: string | number
    text: string
    ts?: string | number | Date
    extra?: Record<string, any>
}

type StatusItem = {
    key: string
    label: string
    ok: boolean
    desc?: string
}

type PollOptions = {
    pollMs?: number;
    maxItems?: number;
    pauseOnHidden?: boolean;
    backoffBaseMs?: number;
    backoffFactor?: number;
    backoffMaxMs?: number;
};

const endpointCache = new Map<string, string>();
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

const toTs = (v?: string | number | Date) => {
    if (!v) return NaN
    const t = new Date(v as any).getTime()
    return isNaN(t) ? NaN : t
}

function uniqBy<T>(arr: T[], keyFn: (x: T) => string | number) {
    const seen = new Set<string | number>();
    const out: T[] = [];
    for (const it of arr) {
        const k = keyFn(it);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(it);
    }
    return out;
}

// 엔드포인트 URL
async function fetchAvailableOnce<T = any>(
    urls: string[],
    signal?: AbortSignal,
    timeout = 4000
): Promise<T | null> {
    if (!urls.length) return null;
    const key = urls.join('|');
    const cached = endpointCache.get(key);

    const order = cached ? [cached, ...urls.filter(u => u !== cached)] : urls;

    for (const u of order) {
        try {
            const { data } = await axios.get<T>(u, { timeout, signal });
            endpointCache.set(key, u);
            return data;
        } catch (e) {
            if (cached && u === cached) endpointCache.delete(key);
            continue;
        }
    }
    return null;
}

// 상대 시간
function timeRecord(input?: string | number | Date): string {
    if (!input) return ''
    const t = new Date(input as any).getTime()
    if (isNaN(t)) return ''
    const s = Math.floor((Date.now() - t) / 1000)
    if (s < 60) return `${s}초 전`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}분 전`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}시간 전`
    const d = Math.floor(h / 24)
    return `${d}일 전`
}

// 폴링 훅
function useFeed(
    urlCandidates: string[],
    mapFn: (raw: any) => FeedItem[],
    pollMsOrOptions: number | PollOptions = 4000
) {
    const opts: PollOptions = typeof pollMsOrOptions === 'number'
        ? { pollMs: pollMsOrOptions }
        : pollMsOrOptions

    const {
        pollMs = 4000,
        maxItems = 8,
        pauseOnHidden = true,
        backoffBaseMs = Math.max(1500, Math.floor(pollMs * 0.75)),
        backoffFactor = 1.6,
        backoffMaxMs = Math.max(30000, pollMs * 8),
    } = opts

    const [items, setItems] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const timerRef = useRef<number | null>(null)
    const inFlight = useRef<AbortController | null>(null)
    const delayRef = useRef<number>(pollMs)
    const pausedRef = useRef<boolean>(false)

    const clearTimer = () => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    const schedule = useCallback((delay: number) => {
        clearTimer()
        const jitter = Math.random() * Math.min(500, delay * 0.2)
        timerRef.current = window.setTimeout(() => void tick(), Math.max(250, delay + jitter)) as unknown as number
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const tick = useCallback(async () => {
        if (pausedRef.current) return
        if (inFlight.current) return

        const ctrl = new AbortController()
        inFlight.current = ctrl

        try {
            setError(null)

            const data = await fetchAvailableOnce<any>(urlCandidates, ctrl.signal)
            if (!data) {
                throw new Error('데이터를 불러올 수 없습니다.')
            }

            const mapped = mapFn(data)
            setItems(prev => {
                const merged = uniqBy(
                    [...mapped, ...prev],
                    x => (x.id ?? x.ts ?? `${x.text}-${x.extra?.ts ?? ''}`)
                ).slice(0, maxItems)
                return merged
            })

            setLoading(false)
            delayRef.current = pollMs
        } catch (e: any) {
            if (axios.isCancel?.(e) || e?.name === 'CanceledError' || e?.message === 'canceled') {
            } else {
                setError(e?.message || '네트워크 오류')
                delayRef.current = Math.min(
                    Math.floor((delayRef.current || backoffBaseMs) * backoffFactor),
                    backoffMaxMs
                )
            }
        } finally {
            inFlight.current?.abort()
            inFlight.current = null
            schedule(delayRef.current || pollMs)
        }
    }, [urlCandidates, mapFn, pollMs, backoffBaseMs, backoffFactor, backoffMaxMs, schedule])

    useEffect(() => {
        if (!pauseOnHidden) return
        const onVis = () => {
            pausedRef.current = document.hidden
            if (!document.hidden) {
                delayRef.current = 0
                schedule(0)
            } else {
                clearTimer()
                inFlight.current?.abort()
                inFlight.current = null
            }
        }
        document.addEventListener('visibilitychange', onVis)
        window.addEventListener('focus', onVis)
        window.addEventListener('blur', onVis)
        return () => {
            document.removeEventListener('visibilitychange', onVis)
            window.removeEventListener('focus', onVis)
            window.removeEventListener('blur', onVis)
        }
    }, [pauseOnHidden, schedule])

    useEffect(() => {
        pausedRef.current = false
        delayRef.current = 0
        schedule(0)
        return () => {
            pausedRef.current = true
            clearTimer()
            inFlight.current?.abort()
            inFlight.current = null
        }
    }, [schedule, urlCandidates.join('|')])

    // 수동 새로고침
    const reload = React.useCallback(() => {
        delayRef.current = 0
        schedule(0)
    }, [schedule])

    return { items, loading, error, reload }
}

/** 로그 매퍼
 * 1. ASR 로그: text / message / transcript 필드 중 존재하는 것을 사용
 * 2. TTS 로그: response_text / tts_text / content 등
 * 3. 번역 로그: source -> target
 * 4. LLM 로그: role / assistant / user + content
 * 5. 시스템 상태: /health 또는 /status 라우터 사용
 */
const mapASR = (data: any): FeedItem[] => {
    const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : []
    return rows.map((r: any, i: number) => ({
        id: r.id ?? i,
        text: r.text ?? r.message ?? r.transcript ?? '',
        ts: r.created_at ?? r.timestamp ?? r.ts ?? r.time ?? null,
        extra: r
    })).filter((x: { text: any }) => x.text)
}

const mapTTS = (data: any): FeedItem[] => {
    const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : []
    return rows.map((r: any, i: number) => ({
        id: r.id ?? i,
        text: r.tts_text ?? r.response_text ?? r.text ?? r.content ?? '',
        ts: r.created_at ?? r.timestamp ?? r.ts ?? r.time ?? null,
        extra: r
    })).filter((x: { text: any }) => x.text)
}

const mapTranslate = (data: any): FeedItem[] => {
    const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : []
    return rows.map((r: any, i: number) => {
        const src = r.source ?? r.src ?? r.input ?? r.text ?? ''
        const tgt = r.target ?? r.tgt ?? r.output ?? r.translated ?? ''
        return {
            id: r.id ?? i,
            text: src ? `“${src}” → “${tgt}”` : (tgt || ''),
            ts: r.created_at ?? r.timestamp ?? r.ts ?? r.time ?? null,
            extra: r
        }
    }).filter((x: { text: any }) => x.text)
}

const mapLLM = (data: any): FeedItem[] => {
    const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : []
    return rows.map((r: any, i: number) => ({
        id: r.id ?? i,
        text: r.content ?? r.text ?? '',
        ts: r.created_at ?? r.timestamp ?? r.ts ?? r.time ?? null,
        extra: r
    })).filter((x: { text: any }) => x.text)
}

function useSystemStatus(pollMs = 7000) {
    const [items, setItems] = useState<StatusItem[]>([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        const data = await fetchAvailableOnce<any>([
            `${BASE_URL}/health`,
            `${BASE_URL}/status`,
            `${BASE_URL}/api/health`
        ])
        const ok = (v: any) => v === true || v === 'ok' || v === 'healthy' || v === 'UP'
        const out: StatusItem[] = [
            { key: 'asr', label: 'ASR', ok: ok(data?.asr), desc: data?.asr_desc ?? 'Azure Speech' },
            { key: 'translate', label: 'Translate', ok: ok(data?.translate), desc: data?.translate_desc ?? 'Azure Translator' },
            { key: 'llm', label: 'LLM', ok: ok(data?.llm), desc: data?.llm_desc ?? (data?.llm_model || '활성화') },
            { key: 'tts', label: 'TTS', ok: ok(data?.tts), desc: data?.tts_desc ?? '로컬 모델' },
            { key: 'vrm', label: 'VRM', ok: ok(data?.vrm), desc: data?.vrm_desc ?? (data?.vrm_model || '') },
            { key: 'db', label: 'DB', ok: ok(data?.db), desc: data?.db_desc ?? 'MySQL' },
        ]
        setItems(out)
        setLoading(false)
    }, [])

    useEffect(() => {
        load()
        const id = setInterval(load, pollMs)
        return () => clearInterval(id)
    }, [load, pollMs])

    return { items, loading, reload: load }
}

const glowClass =
    'shadow-[0_0_10px_rgba(99,102,241,0.35),0_0_18px_rgba(99,102,241,0.45)] ring-1 ring-indigo-400/30 animate-glowPulse rounded-xl'

function GradientFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={clsx('p-[1px] rounded-2xl bg-gradient-to-br from-indigo-300/30 via-white/10 to-fuchsia-300/30', className)}>
            <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                {children}
            </div>
        </div>
    )
}

// 카드 컴포넌트
const DETAIL_TABS = ['Overview', 'Logs', 'Latency', 'Quality'] as const
type DetailTab = typeof DETAIL_TABS[number]

function PillTabs<T extends string>({
    tabs, value, onChange, ariaLabel,
}: {
    tabs: readonly T[]
    value: T
    onChange: (v: T) => void
    ariaLabel: string
}) {
    const onKeyNav = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const i = tabs.indexOf(value)
        const next = e.key === 'ArrowRight'
            ? tabs[(i + 1) % tabs.length]
            : tabs[(i - 1 + tabs.length) % tabs.length]
        onChange(next)
    }, [tabs, value, onChange])

    return (
        <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyNav} className="flex flex-wrap gap-2">
            {tabs.map((t) => {
                const active = value === t
                return (
                    <button
                        key={t}
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(t)}
                        className={[
                            'px-3 py-1 rounded-md text-[11px] font-medium transition-all ring-1',
                            active
                                ? 'bg-indigo-500/10 text-indigo-300 ring-indigo-400/30 shadow-[0_6px_20px_-6px_rgba(99,102,241,0.5)]'
                                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 ring-white/10',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50',
                        ].join(' ')}
                    >
                        {t}
                    </button>
                )
            })}
        </div>
    )
}

function KeyStat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-xl p-3 bg-white/10 ring-1 ring-white/10 flex items-center gap-3">
            <div className="shrink-0 opacity-90 text-white">{icon}</div>
            <div className="min-w-0">
                <div className="text-[11px] text-white/80">{label}</div>
                <div className="text-sm font-semibold text-white truncate">{value}</div>
                {hint && <div className="text-[11px] text-white/70 truncate">{hint}</div>}
            </div>
        </div>
    )
}

type StepState = 'ok' | 'warn' | 'error' | 'idle'
function toneClass(state: StepState | boolean) {
    if (typeof state === 'boolean') return state ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30' : 'bg-rose-500/15 text-rose-200 ring-rose-400/30'
    return state === 'ok' ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25'
        : state === 'warn' ? 'bg-yellow-400/10 text-yellow-300 ring-yellow-400/25'
        : state === 'error' ? 'bg-rose-400/10 text-rose-300 ring-rose-400/25'
        : 'bg-white/5 text-white/70 ring-white/10'
}

function PipelineStep({ index, name, state = 'idle', latencyMs }: { index: number; name: string; state?: StepState; latencyMs?: number }) {
    return (
        <div className="group rounded-xl px-3 py-2 bg-white/10 ring-1 ring-white/10 hover:bg-white/15 transition flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-white/10 grid place-items-center text-[11px] text-white/80">{index}</div>
                <div className="text-sm font-medium text-white truncate">{name}</div>
            </div>
            <span
                className={clsx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ring-1', toneClass(state))}
                title={latencyMs ? `p50 ~${latencyMs}ms` : undefined}
            >
                <Activity className="size-3" />
                {state.toUpperCase()}
            </span>
        </div>
    )
}

function LogBubble({
    icon, text, ts, accent = 'indigo'
}: { icon: React.ReactNode; text: string; ts?: string | number | Date; accent?: 'indigo'|'blue'|'rose'|'purple' }) {
    const shadow =
        accent === 'blue' ? 'hover:shadow-[0_0_18px_rgba(59,130,246,0.35)]'
        : accent === 'rose' ? 'hover:shadow-[0_0_18px_rgba(244,63,94,0.35)]'
        : accent === 'purple' ? 'hover:shadow-[0_0_18px_rgba(139,92,246,0.35)]'
        : 'hover:shadow-[0_0_18px_rgba(99,102,241,0.35)]'

    return (
        <div
            className={clsx(
                'rounded-xl px-3 py-2 ring-1 transition',
                'bg-white/70 dark:bg-white/5 ring-black/10 dark:ring-white/10',
                'text-sm text-gray-800 dark:text-gray-200',
                shadow
            )}
        >
            <span className="inline-flex items-center gap-1.5">{icon}{text}</span>
            {ts && (
                <div className="flex justify-end">
                    <span className="text-[11px] text-gray-500 dark:text-white/50">{timeRecord(ts)}</span>
                </div>
            )}
        </div>
    )
}

function FeedGroupCard({
    leftTitle, rightTitle, leftItems, rightItems, leftIcon, rightIcon, leftAccent, rightAccent, onRefresh
}: {
    leftTitle: string; rightTitle: string
    leftItems: FeedItem[]; rightItems: FeedItem[]
    leftIcon: React.ReactNode; rightIcon: React.ReactNode
    leftAccent?: 'indigo' | 'blue' | 'rose' | 'purple'
    rightAccent?: 'indigo' | 'blue' | 'rose' | 'purple'
    onRefresh?: () => void;
}) {
    return (
        <GradientFrame>
            <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-white/85">
                        <Sparkles className="w-4 h-4 text-white/80" />
                        <span className="text-sm font-semibold">{leftTitle} · {rightTitle}</span>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/10 text-white/80 hover:bg-white/15 transition"
                            title="새로고침"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            새로고침
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        {leftItems.slice(0, 6).map((it, i) => (
                            <div key={it.id} className={i === 0 ? glowClass : ''}>
                                <LogBubble icon={leftIcon} text={` ${it.text}`} ts={it.ts} accent={leftAccent} />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                        {rightItems.slice(0, 6).map((it, i) => (
                            <div key={it.id} className={i === 0 ? glowClass : ''}>
                                <LogBubble icon={rightIcon} text={` ${it.text}`} ts={it.ts} accent={rightAccent} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </GradientFrame>
    )
}

function StatusTile({ icon, label, ok, desc }: { icon: React.ReactNode; label: string; ok: boolean; desc?: string }) {
    return (
        <div
            className={clsx(
                'rounded-lg p-3 ring-1 transition min-w-0',
                'bg-white/[.06] hover:bg-white/[.08] ring-white/10'
            )}
        >
            <div className="flex items-start gap-2">
                <div className="shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm truncate">{label}</p>
                        <span
                            className={clsx(
                                'inline-flex items-center gap-1 text-[10px] rounded-md px-1.5 py-0.5 ring-1',
                                ok ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30'
                                    : 'bg-rose-500/15 text-rose-200 ring-rose-400/30'
                            )}
                        >
                            <ShieldCheck className="w-3 h-3" />
                            {ok ? 'OK' : 'DOWN'}
                        </span>
                    </div>
                    <p className={clsx('text-[12px] mt-0.5 truncate', ok ? 'text-white/75' : 'text-rose-300')}>
                        {ok ? (desc || '정상') : (desc || '연결 실패/비활성')}
                    </p>
                </div>
            </div>
        </div>
    )
}

function StatusBoard({ items, onReload }: { items: StatusItem[]; onReload?: () => void }) {
    const iconOf = (k: string) =>
        k === 'asr' ? <Mic className="w-4 h-4 text-purple-300" />
            : k === 'translate' ? <Languages className="w-4 h-4 text-sky-300" />
                : k === 'llm' ? <Brain className="w-4 h-4 text-pink-300" />
                    : k === 'tts' ? <Volume2 className="w-4 h-4 text-white/80" />
                        : k === 'vrm' ? <User className="w-4 h-4 text-indigo-300" />
                            : k === 'db' ? <Database className="w-4 h-4 text-emerald-300" />
                                : null

    return (
        <GradientFrame>
            <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-white/85">
                        <ShieldCheck className="w-4 h-4 text-white/80" />
                        <span className="text-sm font-semibold">시스템 상태</span>
                    </div>
                    {onReload && (
                        <button
                            onClick={onReload}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/10 bg-white/10 text-white/80 hover:bg-white/15 transition"
                            title="새로고침"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            새로고침
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map(s => (
                        <StatusTile key={s.key} icon={iconOf(s.key)} label={s.label} ok={s.ok} desc={s.desc} />
                    ))}
                </div>
            </div>
        </GradientFrame>
    )
}

export default function HomeDetail({ onBack }: { onBack: () => void }) {
    // 후보 엔드포인트
    const { items: asr, reload: reloadASR } = useFeed(
        [`${BASE_URL}/asr/logs?limit=12`, `${BASE_URL}/logs/asr?limit=12`, `${BASE_URL}/asr/recent?limit=12`],
        mapASR, 3500
    )
    const { items: tts, reload: reloadTTS } = useFeed(
        [`${BASE_URL}/tts/logs?limit=12`, `${BASE_URL}/logs/tts?limit=12`, `${BASE_URL}/tts/recent?limit=12`],
        mapTTS, 3500
    )
    const { items: tr, reload: reloadTR } = useFeed(
        [`${BASE_URL}/translate/logs?limit=12`, `${BASE_URL}/logs/translate?limit=12`, `${BASE_URL}/translation/logs?limit=12`],
        mapTranslate, 4000
    )
    const { items: llm, reload: reloadLLM } = useFeed(
        [`${BASE_URL}/llm/logs?limit=12`, `${BASE_URL}/logs/llm?limit=12`, `${BASE_URL}/llm/messages?limit=12`],
        mapLLM, 4000
    )
    const { items: status, reload: reloadStatus } = useSystemStatus(7000)

    const [tab, setTab] = useState<DetailTab>('Overview')

    //TODO: 샘플 변경
    const stats = useMemo(() => ({
        status: 'Idle',
        stages: 5,
        uptime: '03:12:44',
        build: 'r2025.08.21-α',
        p50: '128ms',
        quality: 'B+',
    }), [])

    return (
        <div className='w-full h-full overflow-y-auto scrollHomeArea'>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className='w-full h-full'
            >
                <div className='mx-auto w-full max-w-[1100px] px-6 md:px-10 py-10'>
                    <div className="flex items-center justify-between mb-6">
                        <div className="inline-flex items-center gap-2 text-gray-900 dark:text-white">
                            <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-white/70" />
                            <h2 className="text-xl md:text-2xl font-semibold">Arielle 디테일</h2>
                        </div>
                        <button
                            onClick={onBack}
                            className="
                                inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl
                                bg-white/70 dark:bg-white/5
                                text-gray-800 dark:text-white/80
                                ring-1 ring-black/10 dark:ring-white/10
                                hover:bg-white/90 dark:hover:bg-white/10
                                transition
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60
                            "
                        >
                            <ArrowLeft className="w-4 h-4" />
                            돌아가기
                        </button>
                    </div>

                    <GradientFrame className="mb-8">
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex items-center gap-2 text-white">
                                <Sparkles className="w-5 h-5 text-white/80" />
                                <span className="text-sm font-semibold">Pipeline Insights</span>
                            </div>

                            <PillTabs
                                tabs={DETAIL_TABS}
                                value={tab}
                                onChange={setTab}
                                ariaLabel="디테일 인사이트 탭"
                            />

                            {(tab === 'Overview' || tab === 'Latency' || tab === 'Quality') && (
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, x: 30, scale: 0.98 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.98 }}
                                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {tab === 'Overview' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <KeyStat icon={<Activity className="w-4 h-4" />} label="상태" value={stats.status} />
                                                <KeyStat icon={<GitCommitHorizontal className="w-4 h-4" />} label="파이프라인" value={`${stats.stages} stages`} />
                                                <KeyStat icon={<Timer className="w-4 h-4" />} label="Uptime" value={stats.uptime} />
                                                <KeyStat icon={<Server className="w-4 h-4" />} label="Build" value={stats.build} hint={`p50 ${stats.p50}`} />
                                            </div>
                                            <div className="grid gap-2.5">
                                                <PipelineStep index={1} name="ASR (Azure)" state="ok" latencyMs={85} />
                                                <PipelineStep index={2} name="Translate (Azure)" state="ok" latencyMs={22} />
                                                <PipelineStep index={3} name="LLM (Local)" state="ok" latencyMs={180} />
                                                <PipelineStep index={4} name="TTS (Local SBV2)" state="warn" latencyMs={240} />
                                                <PipelineStep index={5} name="VRM (Unity/Eclipse)" state="idle" />
                                            </div>
                                        </>
                                    )}

                                    {tab === 'Latency' && (
                                        <>
                                            <div className="rounded-xl p-4 bg-white/10 ring-1 ring-white/10">
                                                <div className="flex items-center gap-2 mb-2 text-white">
                                                    <Gauge className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">지연 시간 요약</span>
                                                </div>
                                                <div className="text-sm text-white/90">p50 {stats.p50} · p95 340ms (예시)</div>
                                                <div className="mt-3 text-[11px] text-white/70">* 실제 메트릭으로 교체하세요.</div>
                                            </div>
                                            <div className="rounded-xl p-4 bg-white/10 ring-1 ring-white/10">
                                                <div className="flex items-center gap-2 mb-2 text-white">
                                                    <Zap className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">스루풋</span>
                                                </div>
                                                <div className="text-sm text-white/90">~32 req/min (예시)</div>
                                            </div>
                                        </>
                                    )}

                                    {tab === 'Quality' && (
                                        <>
                                            <div className="rounded-xl p-4 bg-white/10 ring-1 ring-white/10">
                                                <div className="flex items-center gap-2 mb-2 text-white">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">품질/안전</span>
                                                </div>
                                                <div className="text-sm text-white/90">Quality Grade: {stats.quality}</div>
                                                <div className="mt-3 text-[11px] text-white/70">* 오차/거부율 등 지표 연결 예정.</div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {tab === 'Overview' && (
                                <div className="pt-2">
                                    <StatusBoard items={status} onReload={reloadStatus} />
                                </div>
                            )}
                        </div>
                    </GradientFrame>

                    {tab === 'Logs' && (
                        <div className="space-y-6">
                            <FeedGroupCard
                                leftTitle="음성 인식"
                                rightTitle="TTS 결과"
                                leftItems={asr}
                                rightItems={tts}
                                leftIcon={<Mic className="w-4 h-4 text-purple-400" />}
                                rightIcon={<Volume2 className="w-4 h-4 text-sky-400" />}
                                leftAccent="purple"
                                rightAccent="blue"
                                onRefresh={() => { reloadASR(); reloadTTS() }}
                            />

                            <FeedGroupCard
                                leftTitle="최근 번역"
                                rightTitle="LLM 답변"
                                leftItems={tr}
                                rightItems={llm}
                                leftIcon={<Languages className="w-4 h-4 text-sky-400" />}
                                rightIcon={<Bot className="w-4 h-4 text-rose-400" />}
                                leftAccent="blue"
                                rightAccent="rose"
                                onRefresh={() => { reloadTR(); reloadLLM() }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}