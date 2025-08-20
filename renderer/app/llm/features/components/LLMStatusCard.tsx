// app/features/llm/components/LLMSystemStats.tsx
'use client'

import { memo, useMemo } from 'react'
import {
    Atom,
    AlignStartVertical,
    Flame,
    SquareFunction,
    Repeat,
    Timer,
    Server,
} from 'lucide-react'
import clsx from 'clsx'

import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useLLMSettingsStore } from '@/app/llm/features/store/llmSettingsStore'

export default function LLMStatusCard() {
    const current = useMCPStore((s) => s.getCurrentConfig())
    const memory = current?.memory
    const sampling = current?.sampling

    const responseTime = useLLMSettingsStore((s) => s.responseTime)
    const device = useLLMSettingsStore((s) => s.device)

    const modelName = current?.name ?? '모델을 선택해 주세요'

    const fmt = useMemo(() => new Intl.NumberFormat('ko-KR'), [])

    const stats = useMemo(
        () => [
            {
                icon: <AlignStartVertical className="w-4 h-4 text-sky-300" />,
                label: "문장 범위",
                value: memory?.maxTokens !== undefined && memory?.maxTokens !== null
                    ? `${fmt.format(memory.maxTokens)} toks`
                    : '-',
            },
            {
                icon: <Flame className="w-4 h-4 text-rose-300" />,
                label: "감정 진폭",
                value: sampling?.temperature ?? '-',
            },
            {
                icon: <SquareFunction className="w-4 h-4 text-violet-300" />,
                label: "top_k",
                value: sampling?.topK ?? '-',
            },
            {
                icon: <SquareFunction className="w-4 h-4 text-indigo-300" />,
                label: "top_p",
                value: sampling?.topP ?? '-',
            },
            {
                icon: <Repeat className="w-4 h-4 text-amber-300" />,
                label: "반복 억제",
                value: sampling?.repetitionPenalty ?? '-',
            },
            {
                icon: <Timer className="w-4 h-4 text-emerald-300" />,
                label: "응답 속도",
                value: typeof responseTime === 'number' ? `${responseTime.toFixed(2)}s` : `${responseTime}s`,
            },
        ],
        [memory?.maxTokens, sampling?.temperature, sampling?.topK, sampling?.topP, sampling?.repetitionPenalty, responseTime, fmt]
    )

    return (
        <div
            className={clsx(
                'w-[260px] p-5 rounded-2xl',
                'bg-gradient-to-br from-[#1f1f2d]/70 to-[#2a2a3d]/60',
                'backdrop-blur-md border border-white/10 shadow-lg text-white space-y-5'
            )}
        >
            {/* 헤더 */}
            <div>
                <div className="flex items-center gap-2 text-xs uppercase text-white/50">
                    <Atom className="w-4 h-4 text-indigo-300" />
                    모델 연산체
                </div>
                <div className="text-lg font-bold text-indigo-300 mt-1 truncate">{modelName}</div>
            </div>

            {/* 스탯 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                {stats.map((s, i) => (
                    <Stat key={i} icon={s.icon} label={s.label} value={s.value} />
                ))}
            </div>

            {/* 디바이스 */}
            <div>
                <div className="flex items-center gap-2 text-xs uppercase text-white/50 mb-1">
                    <Server className="w-4 h-4 text-indigo-300" />
                    디바이스
                </div>
                <div className="text-white text-sm truncate" title={String(device)}>
                    {device}
                </div>
            </div>
        </div>
    )
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string
    value: string | number
    icon: React.ReactNode
}) {
    const isNumeric = typeof value === 'number' || /^\d|[\d,]+\s*\w*$/.test(String(value))

    return (
        <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-white/60">
                {icon}
                <span className="truncate" title={label}>{label}</span>
            </div>
            <span
                className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-medium w-fit',
                    'bg-white/10 ring-1 ring-white/10 text-white',
                    isNumeric && 'tabular-nums font-mono'
                )}
                title={String(value)}
            >
                {String(value)}
            </span>
        </div>
    )
}