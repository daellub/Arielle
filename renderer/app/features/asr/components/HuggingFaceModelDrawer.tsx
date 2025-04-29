// app/features/asr/components/HuggingFaceModelDrawer.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HuggingFaceModel, fetchHuggingFaceModels } from '@/app/features/asr/utils/huggingFaceAPI'
import HuggingFaceModelCard from './HuggingFaceModelCard'

interface HuggingFaceModelDrawerProps {
    open: boolean
    onClose: () => void
    onSelectModel: (model: HuggingFaceModel) => void
}

export default function HuggingFaceModelDrawer({ open, onClose, onSelectModel }: HuggingFaceModelDrawerProps) {
    const [models, setModels] = useState<HuggingFaceModel[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (open) {
            loadModels()
        }
    }, [open])

    const loadModels = async () => {
        setLoading(true)
        const result = await fetchHuggingFaceModels()
        setModels(result)
        setLoading(false)
    }

    const filteredModels = models.filter(model =>
        model.id.toLowerCase().includes(search.toLowerCase()) ||
        model.cardData?.pretty_name?.toLowerCase().includes(search.toLowerCase())
    )

    if (!open) return null

    return (
        <div className='fixed inset-0 backdrop-blur-sm flex justify-end z-50'>
            <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className='w-[400px] bg-white h-full p-4 overflow-y-auto shadow-lg'
            >
                <h3 className='text-lg text-black font-bold mb-4 font-MapoPeacefull'>🤗 HuggingFace 모델 탐색</h3>

                {/* 🔍 검색창 추가 */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="모델 검색..."
                    className="w-full mb-4 px-3 py-2 text-black border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                />

                {loading ? (
                    // Skeleton 로딩
                    <div className='space-y-4'>
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className='h-24 bg-gray-200 animate-pulse rounded-xl' />
                        ))}
                    </div>
                ) : (
                    <div className='space-y-3'>
                        {filteredModels.length > 0 ? (
                            filteredModels.map((model) => (
                                <HuggingFaceModelCard 
                                    key={model.id}
                                    model={model}
                                    onSelect={(selectedModel) => {
                                        onSelectModel(selectedModel)
                                        onClose()
                                    }}
                                />
                            ))
                        ) : (
                            <p>모델을 찾을 수 없습니다.</p>
                        )}
                    </div>
                )}
                <div className='fixed bottom-6 right-6 z-50'>
                    <button
                        onClick={onClose}
                        className='mt-6 w-full px-4 py-2 bg-red-400 hover:bg-red-500 rounded-2xl font-MapoPeacefull'
                    >
                        닫기
                    </button>
                </div>
            </motion.div>
        </div>
    )
}