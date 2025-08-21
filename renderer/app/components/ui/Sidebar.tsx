// app/components/ui/Sidebar.tsx
'use client'

import Image from 'next/image'
import {
    Home,
    SlidersHorizontal,
    ShieldCheck,
    Mic,
    BotMessageSquare,
    Languages,
    Volume2,
    Share2,
    Database,
    Moon
} from 'lucide-react'
import { useState, useCallback, memo } from 'react'
import clsx from 'clsx'

const items = [
    { icon: Home, label: 'Home' },
    { icon: SlidersHorizontal, label: 'Dashboard' },
    { icon: ShieldCheck, label: 'Security' },
    { icon: Mic, label: 'ASR' },
    { icon: BotMessageSquare, label: 'LLM' },
    { icon: Languages, label: 'Translate' },
    { icon: Volume2, label: 'TTS' },
    { icon: Share2, label: 'VRM' },
    { icon: Database, label: 'Database' },
]

const preloadMap: Record<string, () => void> = {
    Home:       () => import('@/app/pages/ExperienceHome'),
    Dashboard:  () => import('@/app/pages/DashboardPage'),
    Security:   () => Promise.resolve(),
    ASR:        () => import('@/app/pages/ASRPage'),
    LLM:        () => import('@/app/pages/LLMPage'),
    Translate:  () => import('@/app/pages/TranslatePage'),
    TTS:        () => import('@/app/pages/TTSPage'),
    VRM:        () => import('@/app/pages/VRMPage'),
    Database:   () => Promise.resolve(),
}

export default function Sidebar({
    selected,
    onSelect,
}: {
    selected: string
    onSelect: (label: string) => void
}) {
    const [hovered, setHovered] = useState(false)
    const handleSelect = useCallback((label: string) => onSelect(label), [onSelect])

    return (
        <aside
            className={clsx(
                'fixed top-0 left-0 h-screen bg-white z-50 flex flex-col justify-between shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]',
                'transition-all duration-300 ease-in-out rounded-r-[45px]',
                hovered ? 'w-[200px]' : 'w-[75px]'
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >

            <div className="flex flex-col gap-9 px-3 pt-5">
                <div className="flex items-center justify-center w-full pt-5">
                    <Image src="/assets/Logo.png" alt="Logo" width={60} height={45} className='min-w-[60px] min-h-[45px]' />
                </div>
                <div className='flex flex-col gap-5'>
                    {items.map(({ icon, label }) => (
                        <SidebarItem
                            key={label}
                            icon={icon}
                            label={label}
                            active={selected === label}
                            showText={hovered}
                            onClick={() => handleSelect(label)}
                            onHover={() => preloadMap[label]?.()}
                        />
                    ))}
                </div>
            </div>
            
            <div className="flex flex-col px-3 pb-8">
                <SidebarItem icon={Moon} label="Dark Mode" showText={hovered}/>
            </div>
        </aside>
    )
}

const SidebarItem = memo(function SidebarItem({
    icon: Icon,
    label,
    active,
    showText,
    onClick,
    onHover,
}: {
    icon: React.ElementType
    label: string
    active?: boolean
    showText: boolean
    onClick?: () => void
    onHover?: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={onHover}
            className={clsx(
            'flex items-center gap-3 px-3.5 py-2 rounded-full transition-all duration-200 ease-in-out',
            'outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
            active ? 'bg-gray-900 text-white' : 'hover:bg-gray-200'
            )}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
        >
            <Icon 
                className={clsx(
                    'w-[23px] h-[23px] min-w-[23px] min-h-[23px] flex-shrink-0',
                    active ? 'text-white' : 'text-black'
                )}
            />
            <span
                className={clsx(
                    'font-MapoPeacefull text-sm whitespace-nowrap transition-transform duration-200',
                    showText ? 'scale-100 ml-1' : 'scale-0 w-0 overflow-hidden',
                    active ? 'text-white' : 'text-black'
                )}
            >
                {label}
            </span>
        </button>
    )      
})