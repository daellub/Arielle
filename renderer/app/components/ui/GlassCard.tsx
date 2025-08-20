// app/components/ui/GlassCard.tsx
'use client'

import clsx from 'clsx'
import React from 'react'

export default function GlassCard({
    className,
    children,
}: React.PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={clsx(
                'relative rounded-[28px]',
                'border border-white/30 dark:border-white/10',
                'bg-white/20 dark:bg-white/[0.06]',
                'backdrop-blur-2xl',
                'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]',
                'ring-1 ring-black/5 dark:ring-white/10',
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/20 to-transparent dark:from-white/08" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
