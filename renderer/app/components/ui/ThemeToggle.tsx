// app/components/ui/ThemeToggle.tsx
'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('theme')
        const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const enable = saved ? saved === 'dark' : preferDark
        document.documentElement.classList.toggle('dark', enable)
        setIsDark(enable)
    }, [])

    const toggle = () => {
        const next = !isDark
        setIsDark(next)
        document.documentElement.classList.toggle('dark', next)
        localStorage.setItem('theme', next ? 'dark' : 'light')
    }

    return (
        <button
            type="button"
            aria-label={isDark ? '라이트 모드로' : '다크 모드로'}
            onClick={toggle}
            className="
                inline-flex items-center gap-2
                rounded-full px-3 py-1.5
                bg-white/70 text-gray-900 ring-1 ring-black/5
                hover:bg-white
                transition
                dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/15
            "
        >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="text-xs font-medium">{isDark ? 'Light' : 'Dark'}</span>
        </button>
    )
}
