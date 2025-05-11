// app/llm/features/components/StreamingIndicator.tsx
'use client'

import { useEffect, useState } from 'react'

interface Props {
    visible: boolean
}

export default function StreamingIndicator({ visible }: Props) {
    const [dots, setDots] = useState('')

    useEffect(() => {
        if (!visible) return
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
        }, 500)
        return () => clearInterval(interval)
    }, [visible])

    if (!visible) return null

    return (
        <div style={{
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ddd3ff',
            opacity: 0.8,
            fontStyle: 'italic',
        }}>
            아리엘이 응답 중입니다{dots}
        </div>
    )
}
