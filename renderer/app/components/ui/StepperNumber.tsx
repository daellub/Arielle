// app/components/ui/StepperNumber.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronUp, ChevronDown, Lock } from 'lucide-react'
import clsx from 'clsx'

type Props = {
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    step?: number
    precision?: number
    disabled?: boolean
    className?: string
    placeholder?: string
    ariaLabel?: string
}

export default function StepperNumber({
    value,
    onChange,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    precision,
    disabled = false,
    className,
    placeholder,
    ariaLabel,
}: Props) {
    const [text, setText] = useState<string>(() => format(value, precision))
    const holdRef = useRef<number | null>(null)
    const speedRef = useRef(300)

    useEffect(() => {
        setText(format(value, precision))
    }, [value, precision])

    const clamp = useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max])

    const parse = useCallback((s: string) => {
        const cleaned = s.replace(/[^\d.-]/g, '')
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : value
    }, [value])

    const commit = useCallback((next: number) => {
        const c = clamp(next)
        onChange(c)
        setText(format(c, precision))
    }, [clamp, onChange, precision])

    const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
    }

    const onBlur = () => commit(parse(text))

    const stepBy = useCallback((dir: 1 | -1, mult = 1) => {
        if (disabled) return
        const delta = step * mult * dir
        commit(value + delta)
    }, [commit, step, value, disabled])

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            stepBy(1, e.shiftKey ? 10 : 1)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            stepBy(-1, e.shiftKey ? 10 : 1)
        } else if (e.key === 'Enter') {
            commit(parse(text))
        } else if (e.key === 'Escape') {
            setText(format(value, precision))
        }
    }

    const onWheel = (e: React.WheelEvent) => {
        if (disabled) return
        if (!e.currentTarget.matches(':focus')) return
        e.preventDefault()
        stepBy(e.deltaY < 0 ? 1 : -1, e.shiftKey ? 10 : 1)
    }

    const startHold = (dir: 1 | -1) => {
        if (disabled) return
        clearTimer()
        speedRef.current = 300
        const tick = () => {
            stepBy(dir)
            speedRef.current = Math.max(40, speedRef.current * 0.86)
            holdRef.current = window.setTimeout(tick, speedRef.current)
        }
        holdRef.current = window.setTimeout(tick, speedRef.current)
    }

    const clearTimer = () => {
        if (holdRef.current) {
            clearTimeout(holdRef.current)
            holdRef.current = null
        }
    }

    const ariaProps = useMemo(() => ({
        role: 'spinbutton',
        'aria-valuemin': Number.isFinite(min) ? min : undefined,
        'aria-valuemax': Number.isFinite(max) ? max : undefined,
        'aria-valuenow': value,
        'aria-label': ariaLabel,
    }), [min, max, value, ariaLabel])

    return (
        <div className={clsx(
            'relative inline-flex items-center rounded-xl ring-1 ring-white/12',
            'bg-gradient-to-b from-white/[.07] to-white/[.05] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]',
            disabled ? 'opacity-60 pointer-events-none' : 'hover:ring-white/20',
            className
        )}>
            <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={text}
                onChange={onInput}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                onWheel={onWheel}
                className={clsx(
                    'no-native-spin',
                    'w-24 px-3 py-2 pr-8 text-sm rounded-full bg-transparent',
                    'text-white placeholder:text-white/35 focus:outline-none'
                )}
                placeholder={placeholder}
                {...ariaProps}
            />

            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-md
                        backdrop-blur-md bg-white/8 ring-1 ring-white/15 shadow-[0_2px_10px_rgba(0,0,0,.25)]"
            >
                <button
                    type="button"
                    onMouseDown={() => startHold(1)}
                    onMouseUp={clearTimer}
                    onMouseLeave={clearTimer}
                    onClick={() => stepBy(1)}
                    className="h-4 w-6 grid place-items-center transition hover:bg-white/10 active:bg-white/20"
                    aria-label="increase"
                    tabIndex={-1}
                >
                    <ChevronUp className="w-2.5 h-2.5 text-white/95" />
                </button>
                <button
                    type="button"
                    onMouseDown={() => startHold(-1)}
                    onMouseUp={clearTimer}
                    onMouseLeave={clearTimer}
                    onClick={() => stepBy(-1)}
                    className="h-4 w-6 grid place-items-center transition border-t border-white/10 hover:bg-white/10 active:bg-white/20"
                    aria-label="decrease"
                    tabIndex={-1}
                >
                    <ChevronDown className="w-2.5 h-2.5 text-white/95" />
                </button>
            </div>

            {disabled && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-black/20">
                    <Lock className="w-3.5 h-3.5 text-white/60" />
                </div>
            )}
        </div>
    )
}

function format(n: number, precision?: number) {
    if (typeof precision === 'number') return n.toFixed(precision)
    return String(n)
}
