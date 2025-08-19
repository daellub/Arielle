// app/asr/features/components/ConfirmPopup.tsx
'use client'

import { useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'

interface ConfirmProps {
    open: boolean
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
    type?: 'danger' | 'info' | 'default'
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
}

function useLockBodyScroll(lock: boolean) {
    useEffect(() => {
        if (!lock) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [lock])
}

function useFocusTrap(enabled: boolean, containerRef: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        if (!enabled || !containerRef.current) return

        const container = containerRef.current
        const focusable = () =>
            Array.from(
                container.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))

        const els = focusable()
        const first = els[0] as HTMLElement | undefined
        const last = els[els.length - 1] as HTMLElement | undefined
        first?.focus()

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return
            const nodes = focusable()
            if (nodes.length === 0) return
            const firstEl = nodes[0]
            const lastEl = nodes[nodes.length - 1]

            if (e.shiftKey) {
                if (document.activeElement === firstEl) {
                    e.preventDefault()
                    ;(lastEl as HTMLElement).focus()
                }
            } else {
                if (document.activeElement === lastEl) {
                    e.preventDefault()
                    ;(firstEl as HTMLElement).focus()
                }
            }
        }

        container.addEventListener('keydown', onKeyDown)
        return () => container.removeEventListener('keydown', onKeyDown)
    }, [enabled, containerRef])
}

export default function ConfirmPopup({ 
    open, 
    title = '확인',
    description = '정말 이 작업을 수행하시겠습니까?', 
    confirmText = '확인',
    cancelText = '취소',
    onConfirm, 
    onCancel,
    type = 'default',
    closeOnBackdrop = true,
    closeOnEscape = true,
}: ConfirmProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const titleId = useRef(`confirm-title-${Math.random().toString(36).slice(2)}`).current
    const descId = useRef(`confirm-desc-${Math.random().toString(36).slice(2)}`).current

    const confirmBtnClass = useMemo(() => {
        const base = 'px-4 py-1 text-sm text-gray-100 rounded transition focus:outline-none focus:ring-2 focus:ring-offset-2'
        switch (type) {
            case 'danger':
                return `${base} bg-red-500 hover:bg-red-600 focus:ring-red-300`
            case 'info':
                return `${base} bg-blue-500 hover:bg-blue-600 focus:ring-blue-300`
            default:
                return `${base} bg-gray-700 hover:bg-gray-800 focus:ring-gray-400`
        }
    }, [type])

    useEffect(() => {
        if (!open || !closeOnEscape) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, closeOnEscape, onCancel])

    // 바디 스크롤 잠금
    useLockBodyScroll(open)

    useFocusTrap(open, panelRef)

    // 백드롭 클릭
    const onBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!closeOnBackdrop) return
            if (e.target === e.currentTarget) onCancel()
        },
        [closeOnBackdrop, onCancel]
    )

    if (typeof window === 'undefined') return null

    const modal = (
        <AnimatePresence>
            {open && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={descId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    onMouseDown={onBackdropClick}
                >
                    {/* 패널 */}
                    <motion.div
                        ref={panelRef}
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.94, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="relative bg-white rounded-xl shadow-xl p-6 w-[340px] max-w-[90%] text-center outline-none"
                        tabIndex={-1}
                    >
                        <h3 id={titleId} className="text-lg font-bold mb-2 text-black">
                            {title}
                        </h3>
                        <p id={descId} className="text-sm text-gray-600 mb-4 whitespace-pre-line">
                            {description}
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={confirmBtnClass}
                            >
                                {confirmText}
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    return createPortal(modal, document.body)
}