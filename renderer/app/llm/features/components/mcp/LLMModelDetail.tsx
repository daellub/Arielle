// app/llm/features/components/mcp/LLMModelDetail.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    FileText,
    Folder,
    Globe,
    Link as LinkIcon,
    Wrench,
    BrainCircuit,
    SlidersHorizontal,
    RefreshCw,
} from 'lucide-react'
import { toast } from '@/app/common/toast/useToastStore'
import { mcpHttp } from '@/app/lib/api/mcp'
import clsx from 'clsx'

interface Props {
    modelId: string
}

interface MCPParams {
    integrations?: string[]
    prompts?: number[]
    local_sources?: number[]
    remote_sources?: number[]
    tools?: { name: string }[]
    memory?: {
        strategy: string
        maxTokens: number
        includeHistory: boolean
        saveMemory: boolean
        contextPrompts: { content: string }[]
    }
    sampling?: {
        temperature: number
        topK: number
        topP: number
        repetitionPenalty: number
    }
}

export default function LLMModelDetails({ modelId }: Props) {
    const [params, setParams] = useState<MCPParams | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [updatedAt, setUpdatedAt] = useState<number | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const fetchParams = useCallback(async (silent = false) => {
        try {
            abortRef.current?.abort()
            const ac = new AbortController()
            abortRef.current = ac
            if (!silent) setLoading(true)
            setRefreshing(silent)

            const { data } = await mcpHttp.get(`/llm/model/${encodeURIComponent(modelId)}/params`, {
                signal: ac.signal as any,
            })
            setParams(data || {})
            setUpdatedAt(Date.now())
        } catch (e: any) {
            if (e?.name === 'AbortError') return
            toast.error({ title: '로드 실패', description: '모델 파라미터를 불러오지 못했습니다.', compact: true })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [modelId])

    useEffect(() => {
        fetchParams(false)
        return () => {
            try { abortRef.current?.abort() } catch {}
        }
    }, [fetchParams])

    const lastUpdatedText = useMemo(() => {
        if (!updatedAt) return '—'
        const d = new Date(updatedAt)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        const ss = String(d.getSeconds()).padStart(2, '0')
        return `${hh}:${mm}:${ss}`
    }, [updatedAt])

    return (
        <div className="rounded-xl p-4 bg-gradient-to-b from-white/[.08] to-white/[.06] ring-1 ring-white/10 text-white/90 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-white/80">모델 상세</div>
                <div className="flex items-center gap-2 text-[11px] text-white/60">
                    <span>마지막 갱신 {lastUpdatedText}</span>
                    <button
                        onClick={() => fetchParams(true)}
                        className={clsx(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-1',
                            'border-white/10 bg-white/10 hover:bg-white/15 transition',
                            refreshing && 'opacity-70 cursor-not-allowed'
                        )}
                        title="새로고침"
                        disabled={refreshing}
                    >
                        <RefreshCw className={clsx('w-3.5 h-3.5', refreshing && 'animate-spin')} />
                        새로고침
                    </button>
                </div>
            </div>

            {loading ? (
                <SkeletonGrid />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Section
                        icon={<LinkIcon className="w-3.5 h-3.5 text-white/70" />}
                        title="연결된 MCP 서버"
                    >
                        <Chips items={params?.integrations} empty="없음" />
                    </Section>

                    <Section
                        icon={<FileText className="w-3.5 h-3.5 text-white/70" />}
                        title="연동된 프롬프트 ID"
                    >
                        <Chips items={params?.prompts} empty="없음" />
                    </Section>

                    <Section
                        icon={<Folder className="w-3.5 h-3.5 text-white/70" />}
                        title="로컬 데이터 소스"
                    >
                        <Chips items={params?.local_sources} empty="없음" />
                    </Section>

                    <Section
                        icon={<Globe className="w-3.5 h-3.5 text-white/70" />}
                        title="원격 데이터 소스"
                    >
                        <Chips items={params?.remote_sources} empty="없음" />
                    </Section>

                    <Section
                        icon={<Wrench className="w-3.5 h-3.5 text-white/70" />}
                        title="연결된 툴"
                    >
                        <Chips items={(params?.tools || []).map(t => t.name)} empty="없음" tone="indigo" />
                    </Section>

                    <Section
                        icon={<BrainCircuit className="w-3.5 h-3.5 text-white/70" />}
                        title="Memory 설정"
                    >
                        {params?.memory ? (
                            <div className="flex flex-wrap gap-1.5">
                                <KVChip k="strategy" v={params.memory.strategy} tone="emerald" />
                                <KVChip k="maxTokens" v={params.memory.maxTokens} />
                                <KVChip k="includeHistory" v={params.memory.includeHistory ? 'true' : 'false'} />
                                <KVChip k="saveMemory" v={params.memory.saveMemory ? 'true' : 'false'} />
                                <KVChip k="contextPrompts" v={(params.memory.contextPrompts?.length ?? 0).toString()} />
                            </div>
                        ) : (
                            <EmptyBadge />
                        )}
                    </Section>

                    <Section
                        icon={<SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />}
                        title="Sampling 설정"
                    >
                        {params?.sampling ? (
                            <div className="flex flex-wrap gap-1.5">
                                <KVChip k="temperature" v={params.sampling.temperature} />
                                <KVChip k="topK" v={params.sampling.topK} />
                                <KVChip k="topP" v={params.sampling.topP} />
                                <KVChip k="repetitionPenalty" v={params.sampling.repetitionPenalty} />
                            </div>
                        ) : (
                            <EmptyBadge />
                        )}
                    </Section>
                </div>
            )}
        </div>
    )
}

function Section({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-lg p-3 ring-1 ring-white/10 bg-white/[.04] hover:bg-white/[.06] transition min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-semibold mb-2 shrink-0">
                {icon}
                <span className='truncate'>{title}</span>
            </div>
            <div className='min-w-0'>{children}</div>
        </div>
    )
}

function EmptyBadge() {
    return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-white/10 text-white/50 border border-white/10">
            없음
        </span>
    )
}

function Chips({
    items,
    empty = '없음',
    tone = 'slate',
}: {
    items?: Array<string | number> | null
    empty?: string
    tone?: 'slate' | 'indigo' | 'emerald'
}) {
    if (!items || items.length === 0) return <EmptyBadge />
    const toneClass =
        tone === 'indigo'
            ? 'bg-indigo-500/15 text-indigo-100 border-indigo-400/30'
            : tone === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30'
            : 'bg-white/10 text-white/80 border-white/10'
    return (
        <div className="flex flex-wrap gap-1.5 items-start">
            {items.map((it, i) => (
                <span
                    key={`${it}-${i}`}
                    className={clsx(
                        'inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border max-w-full',
                        'overflow-hidden text-ellipsis whitespace-nowrap',
                        toneClass
                    )}
                    title={String(it)}
                >
                    {String(it)}
                </span>
            ))}
        </div>
    )
}

function KVChip({ k, v, tone }: { k: string; v: string | number; tone?: 'emerald' }) {
    const base = 'inline-flex items-center rounded-md text-[11px] border px-2 py-0.5 max-w-full'
    const cls =
        tone === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30'
            : 'bg-white/10 text-white/85 border-white/10'
    return (
        <span className={clsx(base, cls)}>
            <span className="text-white/60 text-ellipsis whitespace-nowrap overflow-hidden">{k}: </span>
            <span className="font-medium overflow-hidden">{String(v)}</span>
        </span>
    )
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg p-3 ring-1 ring-white/10 bg-white/[.04]">
                    <div className="animate-pulse space-y-2">
                        <div className="h-3 w-40 bg-white/10 rounded" />
                        <div className="h-2 w-3/4 bg-white/10 rounded" />
                        <div className="h-2 w-1/2 bg-white/10 rounded" />
                    </div>
                </div>
            ))}
        </div>
    )
}