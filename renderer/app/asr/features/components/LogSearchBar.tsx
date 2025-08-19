// app/asr/features/components/LogSearchBar.tsx
'use client'

import styles from './LogSearchBar.module.css'
import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { Search, X } from 'lucide-react'

function useClickOutside(
    ref: React.RefObject<HTMLElement | null>,
    when: boolean,
    handler: () => void
) {
    useEffect(() => {
        if (!when) return
        const onDown = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return
            handler()
        }
        document.addEventListener('mousedown', onDown, { capture: true })
        return () => document.removeEventListener('mousedown', onDown, { capture: true })
    }, [ref, handler, when])
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
    const [activeIdx, setActiveIdx] = useState<number>(-1)

    const wrapRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listId = useId()

    useClickOutside(wrapRef, open, () => {
        setOpen(false)
        setActiveIdx(-1)
    })

    const handleFocus = () => {
        if (suggestions.length > 0) setOpen(true)
    }

    const handleChange = useCallback(
        (v: string) => {
            onChange(v)
            if (!open && v.trim().length > 0 && suggestions.length > 0) setOpen(true)
            if (v.trim().length === 0) setOpen(false)
            setActiveIdx(-1)
        },
        [onChange, open, suggestions.length]
    )

    useEffect(() => {
        if (value.trim().length > 0 && suggestions.length > 0) {
            setOpen(true)
        } else {
            setOpen(false)
            setActiveIdx(-1)
        }
    }, [value, suggestions.length])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            setOpen(true)
            return
        }
        if (!open) {
            if (e.key === 'Enter') onSearch()
                return
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIdx((i) => (i + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const pick = suggestions[activeIdx]
            if (pick) {
                onSelect(pick)
                setOpen(false)
                inputRef.current?.blur()
            } else {
                onSearch()
            }
        } else if (e.key === 'Escape') {
            setOpen(false)
            setActiveIdx(-1)
        }
    }

    return (
        <div ref={wrapRef} className={styles.wrapper} role='combobox' 
            aria-expanded={open} aria-owns={listId} aria-haspopup='listbox'>
            {/* 검색 바 */}
            <div className={styles.bar}>
                <button
                    type="button"
                    onClick={onSearch}
                    className={styles.iconBtn}
                    aria-label="검색 실행"
                    title="검색"
                >
                    <Search className={styles.icon} />
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search logs..."
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    className={styles.input}
                    aria-autocomplete='list'
                    aria-controls={listId}
                    aria-activedescendant={
                        open && activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined
                    }
                />

                {!!value && (
                    <button
                        type='button'
                        onClick={() => {
                            onChange('')
                            setOpen(false)
                            setActiveIdx(-1)
                            inputRef.current?.focus()
                        }}
                        className={styles.clearBtn}
                        aria-label='지우기'
                        title='지우기'
                    >
                        <X className={styles.clearIcon} />
                    </button>
                )}
            </div>

            {/* 제안 목록 */}
            {open && suggestions.length > 0 && (
                <ul id={listId} role="listbox" className={styles.dropdown}>
                    {suggestions.map((s, i) => (
                        <li
                            id={`${listId}-opt-${i}`}
                            role='option'
                            aria-selected={i === activeIdx}
                            key={`${s}-${i}`}
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onSelect(s)
                                setOpen(false)
                                setActiveIdx(-1)
                            }}
                            className={`${styles.item} ${i === activeIdx ? styles.itemActive : ''}`}
                            title={s}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}