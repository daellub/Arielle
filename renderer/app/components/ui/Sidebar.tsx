// app/components/ui/Sidebar.tsx
'use client'

import Image from 'next/image'
import React, {useState} from 'react'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'

const items = [
    { icon: '/icons/Sidebar/Home.svg', label: 'Home'},
    { icon: '/icons/Sidebar/Dashboard.svg', label: 'Dashboard'},
    { icon: '/icons/Sidebar/Security.svg', label: 'Security'},
    { icon: '/icons/Sidebar/ASR.svg', label: 'ASR', active: true},
    { icon: '/icons/Sidebar/LLM.svg', label: 'LLM'},
    { icon: '/icons/Sidebar/Translate.svg', label: 'Translate'},
    { icon: '/icons/Sidebar/TTS.svg', label: 'TTS'},
    { icon: '/icons/Sidebar/VRM.svg', label: 'VRM'},
    { icon: '/icons/Sidebar/DB.svg', label: 'Database'},
]

import Link from 'next/link'

export default function Sidebar() {
    const [hovered, setHovered] = useState(false)
    const pathname = usePathname()

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
            {/* 로고 */}
            <div className="flex flex-col gap-9 px-3 pt-5">
                <div className="flex items-center justify-center w-full pt-5">
                    <Image src="/assets/Logo.png" alt="Logo" width={60} height={45} className='min-w-[60px] min-h-[45px]' />
                </div>
                <div className='flex flex-col gap-5'>
                    {items.map((item, i) => {
                        const route = item.label === 'Home' ? '/' : `/${item.label.toLowerCase()}`
                        const isActive = pathname === route

                        return (
                            <Link key={i} href={route}>
                                <SidebarItem
                                    src={item.icon}
                                    label={item.label}
                                    active={isActive}
                                    showText={hovered}
                                />
                            </Link>
                        )
                    })}
                </div>
            </div>
            {/* 다크모드 토글 */}
            <div className="flex flex-col px-3 pb-8">
                <SidebarItem src="/icons/Sidebar/moon.svg" label="Dark Mode" showText={hovered}/>
            </div>
        </aside>
    )
}

function SidebarItem({
    src,
    label,
    active,
    showText,
}: {
    src: string
    label: string
    active?: boolean
    showText: boolean
}) {
    return (
        <div 
            className={clsx(
                'flex items-center gap-3 px-3.5 py-2 rounded-full transition-all duration-200 ease-in-out cursor-pointer',
                active ? 'bg-gray-900 text-white' : 'hover:bg-gray-400'
            )}
        >
            {/* 아이콘 */}
            <Image src={src} alt={label} width={23} height={23} 
                className={clsx(
                    'w-[23px] h-[23px] min-w-[23px] min-h-[23px] flex-shrink-0',
                    active ? 'filter invert' : ''
                )}
                priority
            />
            {/* 텍스트 */}
            <span 
                className={clsx(
                    'font-MapoPeacefull text-sm text-black whitespace-nowrap transition-transform duration-200',
                    showText ? 'scale-100 ml-1' : 'scale-0 w-0 overflow-hidden',
                    active ? 'text-white' : ''
                )}
            >
                {label}
            </span>
        </div>
    )
}