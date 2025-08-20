// app/translate/features/components/charts/PieChartClient.tsx
'use client'

import React, { useId, useMemo } from 'react'
import { PieChart, Pie, Cell } from 'recharts'

interface Props {
    llmRatio: number
    size?: number
    showLabel?: boolean
    decimals?: number
    colors?: { primary: string; track: string }
    animate?: boolean
}

function clamp01to100(n: number) {
    if (!Number.isFinite(n)) return 0
    return Math.min(100, Math.max(0, n))
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const onChange = () => setReduced(mq.matches)
        onChange()
        mq.addEventListener?.('change', onChange)
        return () => mq.removeEventListener?.('change', onChange)
    }, [])
    return reduced
}

export default function PieChartClient({
    llmRatio,
    size = 60,
    showLabel = true,
    decimals = 0,
    colors = { primary: '#ec4899', track: '#e5e7eb' },
    animate,
}: Props) {
    const id = useId()
    const reduced = usePrefersReducedMotion()
    const isAnim = animate ?? !reduced

    const ratio = clamp01to100(llmRatio)
    const data = useMemo(
        () => [
            { name: 'LLM', value: ratio },
            { name: 'Other', value: 100 - ratio },
        ],
        [ratio]
    )

    const labelText = useMemo(() => {
        const fmt = new Intl.NumberFormat(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
        return `${fmt.format(ratio)}%`
    }, [ratio, decimals])

    return (
        <div
            style={{ width: size, height: size }}
            className="relative select-none"
            role="img"
            aria-label={`LLM 비율 ${labelText}`}
        >
            <svg width={size} height={size} viewBox="0 0 60 60">
                <defs>
                    <radialGradient id={`grad-${id}`} cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity="0.75" />
                    </radialGradient>
                </defs>

                <foreignObject x="0" y="0" width="60" height="60">
                    <PieChart width={60} height={60}>
                        <Pie
                            data={data}
                            cx={30}
                            cy={30}
                            innerRadius={12}
                            outerRadius={18}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={1}
                            dataKey="value"
                            isAnimationActive={isAnim}
                            animationDuration={500}
                        >
                            <Cell fill={`url(#grad-${id})`} />
                            <Cell fill={colors.track} />
                        </Pie>
                    </PieChart>
                </foreignObject>

                {showLabel && (
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="10"
                        fontWeight={700}
                        fill="#111827"
                    >
                        {labelText}
                    </text>
                )}
            </svg>
        </div>
    )
}