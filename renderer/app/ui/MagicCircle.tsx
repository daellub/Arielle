// app/components/ui/MagicCircle.tsx
'use client'

import { useTabStore } from '@/app/store/tabStore'
import clsx from 'clsx'
import Image from 'next/image'
import styles from '@/app/styles/MagicCircle.module.css'

export default function MagicCircle() {
    const selectedTab = useTabStore((state) => state.selectedTab)

    const isLLMPage = selectedTab === 'LLM'

    return (
        <Image
            src="/assets/MagicCircle.png"
            alt="magic circle"
            width={800}
            height={800}
            className={clsx(
                styles.magicCircle,
                'absolute',
                'pointer-events-none transition-all duration-500',
                isLLMPage ? 'invert brightness-[1.2]' : ''
            )}
            priority
        />
    )
}
