// app/asr/features/components/LogSearchBar.tsx
'use client'

import styles from './LogSearchBar.module.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import debounce from 'lodash.debounce'

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return
            handler()
        }
        document.addEventListener('mousedown', listener)
        return () => document.removeEventListener('mousedown', listener)
    }, [ref, handler])
}

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

    useClickOutside(ref, () => setOpen(false))

    const debouncedChange = useCallback(
        debounce((v: string) => {
            onChange(v)
        }, 300),
        [onChange]
    )

    return (
        <div ref={ref} >
            <div className="absolute right-13 top-13 flex items-center shadow-lg rounded-full bg-white pl-[68px] pr-5 py-4 w-[300px] h-[50px]">
                <div 
                    onClick={onSearch}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[50px] h-[50px] rounded-full bg-black flex items-center justify-center cursor-pointer"
                >
                    <Search className="text-white w-6 h-6" />
                </div>
                <input
                    type="text"
                    placeholder="Log Searching..."
                    value={value}
                    onChange={(e) => {
                        debouncedChange(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    className="bg-transparent outline-none text-[11px] font-D2Coding tracking-[-0.035em] placeholder:text-neutral-500 w-full"
                />
            </div>

            {open && suggestions.length > 0 && (
                <ul
                    className={`${styles.scrollContainer} bg-white shadow-md mt-2 max-h-[180px] overflow-y-auto rounded-md z-10 absolute right-13 top-[70px] w-[300px] text-[11px]`}
                >
                    {suggestions.map((s) => (
                        <li
                            key={s}
                            tabIndex={0}
                            onClick={() => { onSelect(s); setOpen(false) }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}