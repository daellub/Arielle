// app/asr/features/components/LogSearchBar.tsx
import styles from './LogSearchBar.module.css'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

export default function LogSearchBar({
    value,
    onChange,
    onSearch,
    suggestions,
    onSelect,
}: {
    value: string
    onChange: (v: string) => void
    onSearch: () => void
    suggestions: string[]
    onSelect: (v: string) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    return (
        <div ref={ref} >
            <div className="absolute right-13 top-13 flex items-center shadow-lg rounded-full bg-white pl-[68px] pr-5 py-4 w-[300px] h-[50px]">
                {/* 아이콘 원 */}
                <div 
                    onClick={onSearch}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-black flex items-center justify-center cursor-pointer"
                >
                    <Search className="text-white w-6 h-6" />
                </div>
                {/* 텍스트 */}
                <input
                    type="text"
                    placeholder="Log Searching..."
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    className="bg-transparent outline-none text-[11px] font-D2Coding tracking-[-0.035em] placeholder:text-neutral-500 w-full"
                />
            </div>

            {open && suggestions.length > 0 && (
                <ul className={styles.scrollContainer}>
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            onClick={() => { onSelect(s); setOpen(false) }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[11px]"
                        >
                        {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}