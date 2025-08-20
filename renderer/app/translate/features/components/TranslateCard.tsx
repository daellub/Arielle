// app/translate/features/components/TranslateCard.tsx
'use client'

import { ReactNode, ElementType} from 'react'
import clsx from 'clsx'

interface TranslateCardProps {
    icon: ReactNode
    title: string
    content: string
    color?: string
    glow?: boolean
    className?: string
    as?: ElementType
    onClick?: () => void
    disabled?: boolean
    iconBgClassName?: string
    titleClassName?: string
    bodyClassName?: string
}

export default function TranslateCard({
    icon,
    title,
    content,
    color = 'text-gray-800',
    glow = false,
    className,
    as: As = 'div',
    onClick,
    disabled = false,
    iconBgClassName,
    titleClassName,
    bodyClassName,
}: TranslateCardProps) {
    const clickable = typeof onClick === 'function' && !disabled

    return (
        <As
            onClick={onClick}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-disabled={disabled || undefined}
            className={clsx(
                'relative group rounded-xl border backdrop-blur-md',
                'bg-white/55 border-white/40 shadow-[0_8px_24px_0_rgba(31,38,135,0.16)]',
                'transition-all duration-300',
                clickable && 'hover:bg-white/70 hover:-translate-y-[2px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300/50',
                disabled && 'opacity-60 cursor-not-allowed',
                className
            )}
        >
            {glow && (
                <div 
                    aria-hidden
                    className={clsx(
                        'pointer-events-none absolute -inset-px rounded-[14px]',
                        'bg-[radial-gradient(120px_120px_at_20%_20%,rgba(236,72,153,0.25),transparent_60%),',
                        'radial-gradient(160px_160px_at_80%_40%,rgba(147,51,234,0.22),transparent_60%)]',
                        'opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]'
                    )}
                />
            )}

            <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                    <div
                        className={clsx(
                            'p-2 rounded-full flex items-center justify-center',
                            'bg-white/60 border border-white/70',
                            glow && 'shadow-[0_0_16px_rgba(236,72,153,0.28)]',
                            iconBgClassName
                        )}
                    >
                        {icon}
                    </div>
                    <span className={clsx(color, 'tracking-tight', titleClassName)}>{title}</span>
                </div>

                <div className={clsx('text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap', bodyClassName)}>
                    {content}
                </div>
            </div>
        </As>
    )
}
