// app/dashboard/components/WaterfallTrace.tsx
'use client'

import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { TraceItem } from '@/app/dashboard/types/trace'

interface Props {
    traces: TraceItem[]
    maxRows?: number
}

const BAR_H = 40
const SUB_GAP = 4
const PAD_V = 2
const SUB_H = (BAR_H - 2*PAD_V - SUB_GAP)/2
const TOPS  = [PAD_V, PAD_V + SUB_H + SUB_GAP]

const THRESHOLD_MS: Record<string, number> = {
    ASR: 200,
    TRANSLATE: 180,
    LLM: 800,
    TTS: 400,
    VRM: 200,
}

const SHORT_LABEL: Record<string, string> = {
    TRANSLATE: 'TR',
}

function labelFor(name: string, widthPct: number) {
    const full  = name
    const short = SHORT_LABEL[name] ?? name
    if (widthPct < 8) return short
    if (widthPct < 14) return full.length > 6 ? full.slice(0, 6) : full
    return full
}

function pack2Lanes(stages: TraceItem['stages']) {
    const sorted = stages.map((s, i) => ({ ...s, _i: i }))
                        .sort((a, b) => a.startMs - b.startMs)
    let end0 = -Infinity, end1 = -Infinity
    return sorted.map(s => {
        if (s.startMs >= end0) { end0 = s.endMs; return { ...s, lane: 0, clamped: false } }
        if (s.startMs >= end1) { end1 = s.endMs; return { ...s, lane: 1, clamped: false } }
        end1 = Math.max(end1, s.endMs)
        return { ...s, lane: 1, clamped: true }
    })
}

export default function WaterfallTrace({ traces, maxRows = 8 }: Props) {
    const rows = traces.slice(0, maxRows)
    const maxTotal = useMemo(
        () => Math.max(1, ...rows.map(t => Math.max(...t.stages.map(s => s.endMs)))),
        [rows]
    )

    return (
        <div className="card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h3 className="section-title">실시간 트레이스</h3>
                <span className="text-xs text-white/60">최근 {rows.length}개</span>
            </div>

            <div className="space-y-8">
                {rows.map((t) => {
                    const placed = pack2Lanes(t.stages)
                    return (
                        <div key={t.id} className={clsx('wf-row', !t.ok && 'wf-row--bad')}>
                            <div className="w-32 pr-3 text-xs tone-2">
                                <div className="font-medium">#{t.id.slice(-6)}</div>
                                <div className={clsx(
                                    'inline-block mt-1 px-2 py-0.5 rounded-full border',
                                    t.ok
                                        ? 'border-emerald-400/30 text-emerald-200/90 bg-emerald-400/10'
                                        : 'border-rose-400/30 text-rose-200/90 bg-rose-400/10'
                                )}>
                                    {t.ok ? 'OK' : 'ERR'}
                                </div>
                            </div>

                            <div className="wf-barArea">
                                {placed.map((s, i) => {
                                    const left  = (s.startMs / maxTotal) * 100
                                    const width = ((s.endMs - s.startMs) / maxTotal) * 100
                                    const dur   = s.endMs - s.startMs
                                    const slow  = dur > (THRESHOLD_MS[s.name] ?? Number.MAX_SAFE_INTEGER)

                                    const useCompact = SUB_H < 16;

                                    const tone =
                                        s.name === 'ASR' ? 'asr' :
                                        s.name === 'TRANSLATE' ? 'tr' :
                                        s.name === 'LLM' ? 'llm' :
                                        s.name === 'TTS' ? 'tts' : 'vrm'

                                    const sizeCls = width < 7 ? 'wf-seg--tiny'
                                                : width < 12 ? 'wf-seg--tight' : undefined
                                    const display = labelFor(s.name, width)

                                    return (
                                        <div
                                            key={i}
                                            className={clsx('wf-seg', `wf-${tone}`, sizeCls, !s.ok && 'wf-err')}
                                            style={{
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                top: TOPS[s.lane], height: SUB_H
                                            }}
                                            title={`${s.name} ${dur.toFixed(0)} ms`}
                                            aria-label={`${s.name} ${dur.toFixed(0)} ms`}
                                        >
                                            {!s.ok && (
                                                <span className={clsx('wf-badge wf-badge--err', useCompact && 'wf-badge--compact')}>
                                                    <span className="wf-badge-dot" /> ERR
                                                </span>
                                            )}
                                            {s.ok && slow && (
                                                <span className={clsx('wf-badge wf-badge--warn', useCompact && 'wf-badge--compact')}>
                                                    <span className="wf-badge-dot" /> p95+
                                                </span>
                                            )}
                                            {s.clamped && (
                                                <span className={clsx('wf-badge wf-badge--warn', useCompact && 'wf-badge--compact')} style={{ right: 4, left: 'auto' }}>
                                                    2+
                                                </span>
                                            )}

                                            <span className="wf-segLabel">{display}</span>
                                        </div>
                                    )
                                })}
                                <div className="wf-axis" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
