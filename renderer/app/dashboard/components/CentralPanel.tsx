// app/dashboard/components/CentralPanel.tsx
'use client'

import React, { useMemo } from 'react'
import PipelineGlyph from './PipelineGlyph'
import WaterfallTrace from './WaterfallTrace'
import type { TraceItem } from '../types/trace'

export default function CenterPanel() {
    // 데모 데이터 (백엔드 WS/REST로 교체 예정)
    const traces: TraceItem[] = useMemo(() => ([
        {
            id: 'req_001', startedAt: Date.now(), ok: true,
            stages: [
                { name: 'ASR',        startMs: 0,   endMs: 120, ok: true },
                { name: 'TRANSLATE',  startMs: 120, endMs: 175, ok: true },
                { name: 'LLM',        startMs: 175, endMs: 560, ok: true },
                { name: 'TTS',        startMs: 560, endMs: 820, ok: true },
                { name: 'VRM',        startMs: 560, endMs: 640, ok: true },
            ]
        },
        {
            id: 'req_002', startedAt: Date.now(), ok: false,
            stages: [
                { name: 'ASR',        startMs: 0,   endMs: 110, ok: true },
                { name: 'TRANSLATE',  startMs: 110, endMs: 160, ok: true },
                { name: 'LLM',        startMs: 160, endMs: 900, ok: false },
                { name: 'TTS',        startMs: 900, endMs: 1000, ok: true },
                { name: 'VRM',        startMs: 900, endMs: 980, ok: true },
            ]
        }
    ]), [])

    return (
        <div className="relative w-full min-h-[360px]">
            {/* 배경 글리프(은은하게) */}
            <PipelineGlyph className="dash-centerGlyph dash-centerGlyph--local" />
            {/* 전경 워터폴 */}
            <div className="relative z-10 max-w-4xl mx-auto">
                <WaterfallTrace traces={traces} maxRows={6} />
            </div>
        </div>
    )
}
