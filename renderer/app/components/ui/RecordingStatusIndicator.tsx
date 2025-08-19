// app/asr/features/components/RecordingStatusIndicator.tsx
'use client'

import clsx from 'clsx'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Circle, CircleDot } from 'lucide-react'
import { useRecordingStore } from '@/app/store/useRecordingStore'

export default function RecordingStatusIndicator() {
    const isRecording = useRecordingStore((s) => s.isRecording)
    const [isVisible, setIsVisible] = useState(true)
    const hideTimeout = useRef<number | null>(null)

    useEffect(() => {
        if (!isRecording) {
            if (hideTimeout.current !== null) { window.clearTimeout(hideTimeout.current); hideTimeout.current = null }
        
            hideTimeout.current = window.setTimeout(() => {
                setIsVisible(false)
            }, 3000)
        } else {
            setIsVisible(true)
            if (hideTimeout.current) clearTimeout(hideTimeout.current)
        }
        
        return () => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current)
        }
    }, [isRecording])
    
    return (
        <AnimatePresence mode='wait' initial={false}>
            {isVisible && (
                <motion.div
                    key="recording-indicator"
                    initial={{ opacity: 1, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 1, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999]"
                >
                    <div className="flex items-center gap-5 px-7 py-[12px] bg-blue-50 shadow-md rounded-full min-w-[200px]">
                        {/* 아이콘 */}
                        <div className="relative w-5 h-5 flex items-center justify-center">
                            {isRecording && (
                                <span className="absolute w-4 h-4 rounded-full bg-red-400 opacity-50 animate-ping" />
                            )}
                            <div
                                className={clsx(
                                    'relative z-10 transition-colors duration-300',
                                    isRecording ? 'text-red-500' : 'text-orange-500'
                                )}
                            >
                                {isRecording ? (
                                    <CircleDot className='w-3 h-3' />
                                ) : (
                                    <Circle className='w-3 h-3' />
                                )}
                            </div>
                        </div>
                        
                        {/* 텍스트 */}
                        <div className="flex items-center text-sm font-medium text-neutral-800">
                            <div className="flex items-center">
                                <span>No</span>
                                <div className='relative w-[12px] inline-block'>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={isRecording ? 'w' : 't'}
                                            initial={{ opacity: 0, y: -4, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="inline-block w-2"
                                        >
                                            {isRecording ? 'w' : 't'}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>
                            <motion.span
                                key="recording"
                                animate={{ x: isRecording ? 5 : -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                Recording
                            </motion.span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}