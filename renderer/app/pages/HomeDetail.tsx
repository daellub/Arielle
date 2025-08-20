// app/pages/HomeDetails.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import axios from 'axios'
import clsx from 'clsx'
import {
    Mic, Volume2, Languages, Brain, User, Database, Bot, ArrowLeft, SlidersHorizontal
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
        : pollMsOrOptions;

    const {
        pollMs = 4000,
        maxItems = 8,
        pauseOnHidden = true,
        backoffBaseMs = Math.max(1500, Math.floor(pollMs * 0.75)),
        backoffFactor = 1.6,
        backoffMaxMs = Math.max(30000, pollMs * 8),
    } = opts;

    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const timerRef = useRef<number | null>(null);
    const inFlight = useRef<AbortController | null>(null);
    const delayRef = useRef<number>(pollMs);
    const pausedRef = useRef<boolean>(false);

    const clearTimer = () => {
        if (timerRef.current != null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const schedule = useCallback((delay: number) => {
        clearTimer();
        const jitter = Math.random() * Math.min(500, delay * 0.2);
        timerRef.current = window.setTimeout(() => void tick(), Math.max(250, delay + jitter)) as unknown as number;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tick = useCallback(async () => {
        if (pausedRef.current) return;
        if (inFlight.current) return;

        const ctrl = new AbortController();
        inFlight.current = ctrl;

        try {
            setError(null);

            const data = await fetchAvailableOnce<any>(urlCandidates, ctrl.signal);
            if (!data) {
                throw new Error('데이터를 불러올 수 없습니다.');
            }

            const mapped = mapFn(data);
            setItems(prev => {
                const merged = uniqBy(
                    [...mapped, ...prev],
                    x => (x.id ?? x.ts ?? `${x.text}-${x.extra?.ts ?? ''}`)
                ).slice(0, maxItems);
                return merged;
            });

            setLoading(false);
            delayRef.current = pollMs;
        } catch (e: any) {
            if (axios.isCancel?.(e) || e?.name === 'CanceledError' || e?.message === 'canceled') {
            } else {
                setError(e?.message || '네트워크 오류');
                delayRef.current = Math.min(
                    Math.floor((delayRef.current || backoffBaseMs) * backoffFactor),
                    backoffMaxMs
                );
            }
        } finally {
            inFlight.current?.abort();
            inFlight.current = null;
            schedule(delayRef.current || pollMs);
        }
    }, [urlCandidates, mapFn, pollMs, backoffBaseMs, backoffFactor, backoffMaxMs, schedule]);

    useEffect(() => {
        if (!pauseOnHidden) return;
        const onVis = () => {
            pausedRef.current = document.hidden;
            if (!document.hidden) {
                delayRef.current = 0;
                schedule(0);
            } else {
                clearTimer();
                inFlight.current?.abort();
                inFlight.current = null;
            }
        };
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('focus', onVis);
        window.addEventListener('blur', onVis);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('focus', onVis);
            window.removeEventListener('blur', onVis);
        };
    }, [pauseOnHidden, schedule]);

    useEffect(() => {
        pausedRef.current = false;
        delayRef.current = 0;
        schedule(0);
        return () => {
            pausedRef.current = true;
            clearTimer();
            inFlight.current?.abort();
            inFlight.current = null;
        };
    }, [schedule, urlCandidates.join('|')]);

    // 수동 새로고침
    const reload = useCallback(() => {
        delayRef.current = 0;
        schedule(0);
    }, [schedule]);

    return { items, loading, error, reload };
}

/* 로그 매퍼 
* 1. ASR 로그: text / message / transcript 필드 중 존재하는 것을 사용
* 2. TTS 로그: response_text / tts_text / content 등
* 3. 번역 로그: source -> target
* 4. LLM 로그: role / assistant / user + content
* 5. 시스템 상태: /health 또는 /status 라우터 사용
* **/
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

function useSystemStatus(pollMs = 6000) {
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

const glowClass = 'shadow-[0_0_10px_rgba(99,102,241,0.35),0_0_18px_rgba(99,102,241,0.45)] ring-1 ring-indigo-400/30 animate-glowPulse rounded-xl'

// 카드 컴포넌트
function LineCard({
    icon, text, ts, accentHover
}: { icon: React.ReactNode; text: string; ts?: string | number | Date; accentHover?: string }) {
    return (
        <div
            className={clsx(
                'bg-white/70 dark:bg-white/5 rounded-xl px-3 py-2',
                'ring-1 ring-black/10 dark:ring-white/10',
                'text-sm text-gray-800 dark:text-gray-200',
                'transition hover:bg-white/90 dark:hover:bg-white/10',
                accentHover || 'hover:shadow-[0_0_18px_rgba(139,92,246,0.35)]'
            )}
        >
            <span className='inline-flex items-center gap-1.5'>
                {icon}{text}
            </span>
            {ts && (
                <div className='flex justify-end'>
                    <span className='text-[11px] text-gray-500 dark:text-white/50'>{timeRecord(ts)}</span>
                </div>
            )}
        </div>
    )
}

export default function HomeDetail({ onBack }: { onBack: () => void }) {
    // 후보 엔드포인트
    const { items: asr } = useFeed(
        [
            `${BASE_URL}/asr/logs?limit=12`,
            `${BASE_URL}/logs/asr?limit=12`,
            `${BASE_URL}/asr/recent?limit=12`,
        ],
        mapASR, 3500
    )

    const { items: tts } = useFeed(
        [
            `${BASE_URL}/tts/logs?limit=12`,
            `${BASE_URL}/logs/tts?limit=12`,
            `${BASE_URL}/tts/recent?limit=12`,
        ],
        mapTTS, 3500
    )

    const { items: tr } = useFeed(
        [
            `${BASE_URL}/translate/logs?limit=12`,
            `${BASE_URL}/logs/translate?limit=12`,
            `${BASE_URL}/translation/logs?limit=12`,
        ],
        mapTranslate, 4000
    )

    const { items: llm } = useFeed(
        [
            `${BASE_URL}/llm/logs?limit=12`,
            `${BASE_URL}/logs/llm?limit=12`,
            `${BASE_URL}/llm/messages?limit=12`,
        ],
        mapLLM, 4000
    )

    const { items: status } = useSystemStatus(7000)

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
                            <h2 className="text-xl md:text-2xl font-semibold">Arielle 기능 개요</h2>
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

                    <section className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">음성 인식</h3>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TTS 결과</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    {asr.slice(0, 6).map((it, i) => (
                                        <div key={it.id} className={i === 0 ? glowClass : ''}>
                                            <LineCard
                                                icon={<Mic className="w-4 h-4 text-purple-500" />}
                                                text={` ${it.text}`}
                                                ts={it.ts}
                                                accentHover="hover:shadow-[0_0_18px_rgba(139,92,246,0.35)]"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {tts.slice(0, 6).map((it, i) => (
                                        <div key={it.id} className={i === 0 ? glowClass : ''}>
                                            <LineCard
                                                icon={<Volume2 className="w-4 h-4 text-blue-500" />}
                                                text={` ${it.text}`}
                                                ts={it.ts}
                                                accentHover="hover:shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">최근 번역</h3>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">LLM 답변</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    {tr.slice(0, 6).map((it, i) => (
                                        <div key={it.id} className={i === 0 ? glowClass : ''}>
                                            <LineCard
                                                icon={<Languages className="w-4 h-4 text-blue-500" />}
                                                text={` ${it.text}`}
                                                ts={it.ts}
                                                accentHover="hover:shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {llm.slice(0, 6).map((it, i) => (
                                        <div key={it.id} className={i === 0 ? glowClass : ''}>
                                            <LineCard
                                                icon={<Bot className="w-4 h-4 text-rose-500" />}
                                                text={` ${it.text}`}
                                                ts={it.ts}
                                                accentHover="hover:shadow-[0_0_18px_rgba(244,63,94,0.35)]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">시스템 상태</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {status.map((s) => (
                                    <div
                                        key={s.key}
                                        className={clsx(
                                            'p-3 rounded-xl',
                                            'bg-white/70 dark:bg-white/5',
                                            'ring-1 ring-black/10 dark:ring-white/10',
                                            'transition hover:bg-white/90 dark:hover:bg-white/10',
                                            s.ok ? 'hover:shadow-[0_8px_20px_-8px_rgba(99,102,241,0.35)]' : 'hover:shadow-[0_8px_20px_-8px_rgba(239,68,68,0.35)]'
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            {s.key === 'asr' && <Mic className="w-4 h-4 text-purple-500" />}
                                            {s.key === 'translate' && <Languages className="w-4 h-4 text-blue-500" />}
                                            {s.key === 'llm' && <Brain className="w-4 h-4 text-pink-500" />}
                                            {s.key === 'tts' && <Volume2 className="w-4 h-4 text-gray-700 dark:text-gray-200" />}
                                            {s.key === 'vrm' && <User className="w-4 h-4 text-indigo-500" />}
                                            {s.key === 'db' && <Database className="w-4 h-4 text-green-600" />}

                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">{s.label}</p>
                                                <p className={clsx('text-sm', s.ok ? 'text-gray-600 dark:text-gray-300' : 'text-rose-500')}>
                                                    {s.ok ? (s.desc || '정상') : '연결 실패/비활성'}
                                                </p>
                                            </div>

                                            <span className={clsx(
                                                'mt-0.5 inline-flex h-2 w-2 rounded-full',
                                                s.ok ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                                            )} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </motion.div>
        </div>
    )
}
