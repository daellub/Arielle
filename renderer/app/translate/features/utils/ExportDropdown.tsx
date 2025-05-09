// app/translate/features/utils/ExportDropdown.tsx
'use client'

import { Download } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useRef, useEffect } from 'react'
import type { TranslationHistoryItem } from '@/app/translate/features/components/TranslateHistoryList'

export default function ExportDropdown({ items }: { items: TranslationHistoryItem[] }) {
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleExportCSV = () => {
        const headers = ['Original', 'Translated', 'TargetLang', 'Date', 'Source']
        const rows = items.map(item => [
            `"${item.original}"`,
            `"${item.translated}"`,
            item.targetLang,
            item.date,
            item.source,
        ])
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        downloadFile(csv, 'translations.csv', 'text/csv;charset=utf-8;')
    }

    const handleExportJSON = () => {
        const json = JSON.stringify(items, null, 2)
        downloadFile(json, 'translations.json', 'application/json')
    }

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen(!open)
                }}
                className="px-4 py-1.5 text-sm rounded-md border bg-white/80 hover:bg-white text-gray-700 shadow"
            >
                내보내기
            </button>
            
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute mt-2 right-0 w-40 bg-white border border-gray-200 rounded-md shadow z-50"
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleExportCSV()
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                            CSV로 저장
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleExportJSON()
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                            JSON으로 저장
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
