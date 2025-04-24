// app/components/ModelPopup.tsx

import { motion, AnimatePresence } from 'motion/react'

interface Props {
    model: any
    visible: boolean
    onClose: () => void
    onLoadModel: () => void
    onUnloadModel: () => void
    loadingModelId?: string | null
}

export default function ModelPopup({ model, visible, onClose, onLoadModel, onUnloadModel, loadingModelId }: Props) {
    const isLoading = loadingModelId === model.id
    const isLoaded = model.status === 'active'
    const isIdle = model.status === 'idle'

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.25 }}
                    className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#F3F6FF] rounded-3xl shadow-xl px-6 py-3 text-black flex items-center gap-4 w-fit min-w-[80%] max-w-[80%] min-h-[7%] max-h-[7%] font-semibold text-sm'
                >
                    {/* <div className='w-[10px] h-[10px] rounded-full bg-orange-500' /> */}
                    {/* <div className="text-black text-[14px] font-['Orbitron'] tracking-wide">
                        {model.type}
                    </div> */}
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={onLoadModel}
                            disabled={isLoading || isLoaded}
                            className={`${
                                isLoading || isLoaded ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#7FB3FF] hover:bg-[#6BA3F0]'
                            } text-white rounded-full px-4 py-1 transition-all duration-200 shadow font-bold text-[10px]`}
                        >
                            {isLoading ? '로드 중' : isLoaded ? '로드 완료' : '모델 로드'}
                        </button>
                        <button
                            onClick={onUnloadModel}
                            disabled={isLoading || isIdle }
                            className={`${
                                isLoading || isIdle ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-400 hover:bg-red-500'
                            } text-white rounded-full px-4 py-1 transition-all duration-200 shadow font-bold text-[10px]`}
                        >
                            {isIdle ? '언로드됨' : '모델 언로드'}
                        </button>
                        <button
                            onClick={onClose}
                            className='text-gray-400 hover:text-gray-600 transition-all duration-150 text-[13px]'
                        >
                            X
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}