// app/components/ui/CompareModal.tsx
'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { X, ScrollText, Globe, Sparkles, FileText, RotateCw } from 'lucide-react'
import clsx from 'clsx'

interface CompareModalProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    original: string
    asr: string
    llm: string
    source: 'ASR' | 'Direct' | 'LLM'
    retranslated?: boolean
}

export default function CompareModal({
    open,
    onOpenChange,
    original,
    asr,
    llm,
    source,
    retranslated = false,
}: CompareModalProps) {
    const sections = [
        {
            icon: ScrollText,
            label: '원문',
            text: original,
            color: 'text-gray-700',
        },
        {
            icon: Globe,
            label:
                source === 'ASR'
                    ? 'ASR 인식 결과'
                    : source === 'Direct'
                    ? '직접 입력 번역'
                    : 'LLM 의역',
            text: asr || '없음',
            color: 'text-blue-500',
        },
        {
            icon: Sparkles,
            label: 'LLM 의역',
            text: llm || '의역 결과는 준비 중입니다.',
            color: 'text-pink-500',
        },
    ]

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80" />
                
                <Dialog.Content
                    className={clsx(
                        'fixed z-90 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-full max-w-xl p-6 rounded-xl',
                        'bg-white/20 backdrop-blur-md border border-white/30',
                        'shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] space-y-4'
                    )}
                >
                    <div className="flex justify-between items-center mb-2">
                        <div className='flex items-center gap-2'>
                            <FileText className="w-5 h-5 text-gray-600" />
                            <Dialog.Title className="text-lg font-bold text-gray-900 tracking-wide">
                                문장 비교 보기
                            </Dialog.Title>
                            {retranslated && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium flex items-center gap-1">
                                    <RotateCw className="w-3 h-3" /> 재번역됨
                                </span>
                            )}
                        </div>
                        <Dialog.Close asChild>
                            <button className="text-gray-600 hover:text-black transition">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {sections.map(({ icon: Icon, label, text, color }, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={clsx(
                                        'p-4 rounded-xl border border-white/30 backdrop-blur-md',
                                        'bg-white/30 text-black shadow-sm hover:bg-white/40 hover:scale-[1.02]',
                                        'transition-all duration-300'
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={clsx('w-4 h-4', color)} />
                                        <p className={clsx('text-sm font-semibold', color)}>{label}</p>
                                    </div>
                                    <p className="text-[15px] leading-relaxed font-MapoPeacefull text-gray-800 whitespace-pre-wrap">
                                        {text}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
