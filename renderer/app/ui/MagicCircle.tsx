// app/components/ui/MagicCircle.tsx
'use client'

import { memo, useEffect, useState } from 'react'
import clsx from 'clsx'
import Image from 'next/image'
import styles from '@/app/styles/MagicCircle.module.css'

function usePageVisible() {
    const [visible, setVisible] = useState(
        typeof document !== 'undefined' ? !document.hidden : true
    )

    useEffect(() => {
        const onChange = () => setVisible(!document.hidden)
        document.addEventListener('visibilitychange', onChange)
        return () => document.removeEventListener('visibilitychange', onChange)
    }, [])
    return visible
}

function MagicCircle() {
    const pageVisible = usePageVisible()

    return (
        <Image
            src="/assets/MagicCircle.png"
            alt="magic circle"
            width={800}
            height={800}
            decoding="async"
            sizes="420px"
            loading="lazy"
            className={clsx(
                styles.magicCircle,
                'absolute pointer-events-none transition-opacity duration-400',
                pageVisible ? styles.running : styles.paused
            )}
        />
    )
}

export default memo(MagicCircle)