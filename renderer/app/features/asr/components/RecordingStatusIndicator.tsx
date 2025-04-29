// app/features/asr/components/RecordingStatusIndicator.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Circle, CircleDot } from 'lucide-react'

interface Props {
    isRecording: boolean
}

export default function RecordingStatusIndicator({ isRecording }: Props) {
    const [isVisible, setIsVisible] = useState(true)

    const hideTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!isRecording) {
            if (hideTimeout.current) clearTimeout(hideTimeout.current)
        
            hideTimeout.current = setTimeout(() => {
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
        <AnimatePresence mode='wait'>
            {isVisible && (
                <motion.div
                    key="recording-indicator"
                    initial={{ opacity: 1, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 1, y: -50 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999]"
                >
                    <div className="flex items-center gap-5 px-7 py-[12px] bg-blue-50 shadow-md rounded-full min-w-[200px]">
                        {/* 아이콘 */}
                        <div className="relative w-5 h-5 flex items-center justify-center">
                            {isRecording && (
                                <span className="absolute w-4 h-4 rounded-full bg-red-400 opacity-50 animate-ping" />
                            )}
                            <motion.div
                                animate={{ color: isRecording ? '#ef4444' : '#f97316' }}
                                transition={{ duration: 0.3 }}
                                className='relative z-10'
                            >
                                {isRecording ? (
                                    <CircleDot className='w-3 h-3' />
                                ) : (
                                    <Circle className='w-3 h-3' />
                                )}
                            </motion.div>
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