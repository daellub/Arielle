// app/components/ui/ModalPortal.tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ModalPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true); return () => setMounted(false) }, [])
    if (!mounted) return null
    return createPortal(children, document.body)
}