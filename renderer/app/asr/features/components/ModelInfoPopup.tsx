// app/asr/features/components/ModelInfoPopup.tsx
'use client'

import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'motion/react'
import { HardDrive, X, Cpu, BookOpenCheck, Languages, Power, Settings2, Laptop } from 'lucide-react'
import { Model } from '@/app/asr/features/types/Model'

interface ModelInfoPopupProps {
    model: Model | null
    visible: boolean
    onClose: () => void
}

export default function ModelInfoPopup({
    model,
    visible,
    onClose
}: ModelInfoPopupProps) {
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        if (!visible) setShowDetails(false)
    }, [visible])
    
    if (!visible || !model) return null

    return (
        <AnimatePresence>
            {visible && model && (
                <>
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 flex items-center justify-center z-[999]"
                    >
                        <div className={clsx(
                            "flex flex-row rounded-xl overflow-hidden",
                            showDetails ? "w-[720px]" : "w-[400px]",
                            "bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-300"
                        )}>
                            {/* 기본 정보 */}
                            <div className="w-[400px] p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className='flex items-center justify-between gap-2'>
                                        <HardDrive className='w-4 h-4 animate-pulse' />
                                        <h3 className="text-xl font-bold text-black tracking-wide">모델 정보</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-800 transition-all p-1 rounded-full"
                                        title="닫기"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3 text-sm text-gray-600 mt-4">
                                    {[
                                        { icon: BookOpenCheck, label: '이름', value: model.name, color: 'text-blue-400' },
                                        { icon: Settings2, label: '타입', value: model.type, color: 'text-purple-400' },
                                        { icon: Languages, label: '언어', value: model.language, color: 'text-pink-400' },
                                        { icon: Cpu, label: '프레임워크', value: model.framework, color: 'text-indigo-400' },
                                        { icon: Laptop, label: '디바이스', value: model.device, color: 'text-yellow-400' },
                                    ].map(({ icon: Icon, label, value, color }, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-3 p-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm shadow-sm hover:bg-white/20 hover:shadow-md transition-all duration-200"
                                        >
                                            <Icon className={`w-4 h-4 animate-pulse ${color}`} />
                                            <span><strong>{label}:</strong> {value}</span>
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-3 p-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm shadow-sm">
                                        <Power className="w-4 h-4 text-gray-550" />
                                        <span className={clsx(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                            model.status === 'active' && 'bg-green-500/20 text-green-300',
                                            model.status === 'loading' && 'bg-blue-500/20 text-blue-300 animate-pulse',
                                            model.status === 'error' && 'bg-red-500/20 text-red-300',
                                            model.status === 'idle' && 'bg-gray-500/20 text-gray-550'
                                        )}>
                                            {model.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 text-right">
                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="text-xs text-blue-500 hover:underline"
                                    >
                                        {showDetails ? '간단히 보기' : '자세히 보기'}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 40 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="absolute top-6 left-[420px] w-[300px] p-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg text-sm text-white"
                                    >
                                        {/* 상세 내용 */}
                                        <pre className="whitespace-pre-wrap text-xs">
                                            {/* {JSON.stringify(model.config || {}, null, 2)} */}
                                        </pre>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
