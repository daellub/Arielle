    // app/features/asr/components/HuggingFaceModelDrawer.tsx
    'use client'

    import { useEffect, useState } from 'react'
    import { AnimatePresence, motion } from 'motion/react'
    import { HuggingFaceModel, fetchHuggingFaceModels } from '@/app/features/asr/utils/huggingFaceAPI'
    import HuggingFaceModelCard from './HuggingFaceModelCard'
    import axios from 'axios'
    import ConfirmPopup from './ConfirmPopup'
    import { useDownload } from './DownloadContext'

    interface HuggingFaceModelDrawerProps {
        open: boolean
        onClose: () => void
        onSelectModel: (model: HuggingFaceModel) => void
    }

    export default function HuggingFaceModelDrawer({ open, onClose, onSelectModel }: HuggingFaceModelDrawerProps) {
        const [models, setModels] = useState<HuggingFaceModel[]>([])
        const [loadingList, setLoadingList] = useState(false)
        const [search, setSearch] = useState('')
        const [error, setError] = useState<string|null>(null)

        const [isVisible, setIsVisible] = useState(false)
        const [confirmOpen, setConfirmOpen] = useState(false)
        const [selectedModel, setSelectedModel] = useState<HuggingFaceModel|null>(null)
        const [downloading, setDownloading] = useState(false)
        const [progress, setProgress] = useState(0)
        const { addTask } = useDownload()

        useEffect(() => {
            if (!open) return
            setError(null)
            setLoadingList(true)
            fetchHuggingFaceModels()
                .then(setModels)
                .catch(() => setError('모델 목록 로드 실패'))
                .finally(() => setLoadingList(false))
        }, [open])

        const filteredModels = models.filter(m =>
            m.id.toLowerCase().includes(search.toLowerCase()) ||
            m.cardData?.pretty_name?.toLowerCase().includes(search.toLowerCase())
        )

        const handleCardClick = (model: HuggingFaceModel) => {
            setSelectedModel(model)
            setConfirmOpen(true)
        }

        useEffect(() => {
            if (open) {
                setIsVisible(false)
                setTimeout(() => setIsVisible(true), 0)
            }
        }, [open])
        
        const handleDrawerClose = () => {
            setIsVisible(false)
        }
        
        const handleConfirm = async () => {
            if (!selectedModel) return

            setConfirmOpen(false)

            addTask({
                id: selectedModel.id,
                filename: selectedModel.id,
                downloadFn: (onProgress, token) =>
                    axios.post<{ path: string }>(
                        'http://localhost:8000/api/models/download-model',
                        { model_id: selectedModel.id },
                        {
                            responseType: 'blob',
                            cancelToken: token.token,
                            onDownloadProgress: ev => onProgress(ev.loaded, ev.total!)
                        }
                    ).then(res => res.data.path)
            })
            onSelectModel(selectedModel)
            setIsVisible(false)
        }

        return (
            <>
                <AnimatePresence>
                    {isVisible && (
                        <div className='fixed inset-0 backdrop-blur-sm flex justify-end z-50'>
                            <motion.div
                                initial={{ opacity: 0, x: '100%' }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: '100%' }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                onAnimationComplete={(def) => {
                                    if (def === 'exit') {
                                        onClose()
                                    }
                                }}
                                className='w-[400px] bg-white h-full p-4 overflow-y-auto shadow-lg'
                            >
                                <h3 className='text-lg text-black font-bold mb-4'>🤗 HuggingFace 모델 탐색</h3>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="모델 검색..."
                                    className="w-full mb-4 px-3 py-2 border rounded text-sm"
                                />
                                {loadingList
                                    ? <div className='space-y-4'>{Array(5).fill(0).map((_,i)=><div key={i} className='h-24 bg-gray-200 animate-pulse rounded-xl'/>)}</div>
                                    : error
                                        ? <div className="text-red-500">{error}</div>
                                        : filteredModels.map(model => (
                                            <HuggingFaceModelCard
                                            key={model.id}
                                            model={model}
                                            onSelect={handleCardClick}
                                            />
                                        ))
                                }
                                <button
                                    onClick={handleDrawerClose}
                                    className='mt-6 w-full py-2 bg-red-400 text-white rounded disabled:opacity-50'
                                    disabled={downloading}
                                >
                                    닫기
                                </button>
                            </motion.div>
                        </div>
                    )}
                    </AnimatePresence>

                    <ConfirmPopup
                        open={confirmOpen}
                        title="모델을 다운로드할까요?"
                        description={`"${selectedModel?.cardData?.pretty_name || selectedModel?.id}"\n버튼을 누르면 모델 다운로드를 시작합니다.`}
                        confirmText="예"
                        cancelText="취소"
                        type="info"
                        onConfirm={handleConfirm}
                        onCancel={() => setConfirmOpen(false)}
                    />

                    <AnimatePresence>
                        {downloading && (
                            <motion.div
                                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                                className='fixed inset-0 bg-black/30 flex items-center justify-center z-50'
                            >
                                <motion.div
                                    initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
                                    className='bg-white p-6 rounded-lg text-center'
                                >
                                    <p className='mb-2'>{progress}%</p>
                                    <div className='w-64 h-2 bg-gray-200 rounded-full overflow-hidden'>
                                        <div
                                            className='h-full bg-blue-500'
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                                </motion.div>
                            </motion.div>
                        )}
                </AnimatePresence>
            </>
        )
    }