// app/asr/features/components/ConfirmPopup.tsx
'use client'

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
}

export default function ConfirmPopup({ 
    open, 
    title = '확인',
    description = '정말 이 작업을 수행하시겠습니까?', 
    confirmText = '확인',
    cancelText = '취소',
    onConfirm, 
    onCancel,
    type = 'default'
}: ConfirmProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center'
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='bg-white rounded-xl shadow-xl p-6 w-[320px] max-w-[90%] text-center'
                    >
                        <h3 className="text-lg font-bold mb-2 text-black">{title}</h3>
                        <p className='text-sm text-gray-600 mb-4 whitespace-pre-line'>{description}</p>

                        <div className='flex justify-center gap-3'>
                            <button
                                onClick={onConfirm}
                                className={`px-4 py-1 text-sm text-gray-100 rounded transition ${
                                    type === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : type === 'info'
                                        ? 'bg-blue-500 hover:bg-blue-600'
                                        : 'bg-gray-500 hover:bg-gray-600'
                                }`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onCancel}
                                className='px-4 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 text-sm'
                            >
                                {cancelText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}