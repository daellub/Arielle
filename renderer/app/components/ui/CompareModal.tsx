// app/components/ui/CompareModal.tsx
'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface CompareModalProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    original: string
    asr: string
    llm: string
}

export default function CompareModal({
    open,
    onOpenChange,
    original,
    asr,
    llm,
}: CompareModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80" />
                <Dialog.Content
                    className={clsx(
                        'fixed z-90 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-full max-w-xl bg-white rounded-xl p-6 shadow-lg space-y-4'
                    )}
                    aria-describedby="compare-modal-description"
                >
                    <div className="flex justify-between items-center mb-2">
                        <Dialog.Title className="text-lg font-bold">
                            문장 비교 보기
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-black">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div id="compare-modal-description" className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500 font-medium">📝 원문</p>
                            <p className="text-gray-800">{original}</p>
                        </div>
                        <div>
                            <p className="text-blue-500 font-medium">🌐 ASR 번역</p>
                            <p>{asr || <span className="text-gray-400">- 없음 -</span>}</p>
                        </div>
                        <div>
                            <p className="text-pink-500 font-medium">✨ LLM 의역</p>
                            <p>{llm || <span className="text-gray-400">- 없음 -</span>}</p>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
