// app/asr/features/components/ModelPopup.tsx
'use client'

import { memo, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Model } from '@/app/asr/features/types/Model'

interface Props {
    model: Model
    visible: boolean
    onClose: () => void
    onLoadModel: () => void
    onUnloadModel: () => void
    loadingModelId?: string | null
}

function ModelPopupComp({
    model,
    visible,
    onClose,
    onLoadModel,
    onUnloadModel,
    loadingModelId
}: Props) {
    const { isLoading, isLoaded, isIdle } = useMemo(() => {
        const isLoading = loadingModelId === model.id
        const isLoaded = model.status === 'active'
        const isIdle = model.status === 'idle'
        return { isLoading, isLoaded, isIdle }
    }, [loadingModelId, model.id, model.status])

    const loadLabel = isLoading ? '로드 중' : isLoaded ? '로드 완료' : '모델 로드'
    const unloadLabel = isIdle ? '언로드됨' : '모델 언로드'

    // ESC로 창 닫기
    useEffect(() => {
        if (!visible) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [visible, onClose])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-live="polite"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#F3F6FF]
                                rounded-3xl shadow-xl px-6 py-3 text-black flex items-center gap-4
                                w-fit min-w-[80%] max-w-[80%] min-h-[7%] max-h-[7%] font-semibold text-sm"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onLoadModel}
                            disabled={isLoading || isLoaded}
                            aria-disabled={isLoading || isLoaded}
                            className={`${
                                isLoading || isLoaded ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#7FB3FF] hover:bg-[#6BA3F0]'
                            } text-white rounded-full px-4 py-1 transition-all duration-200 shadow font-bold text-[10px]`}
                        >
                            {loadLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onUnloadModel}
                            disabled={isLoading || isIdle}
                            aria-disabled={isLoading || isIdle}
                            className={`${
                                isLoading || isIdle ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-400 hover:bg-red-500'
                            } text-white rounded-full px-4 py-1 transition-all duration-200 shadow font-bold text-[10px]`}
                        >
                            {unloadLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="닫기"
                            className="text-gray-400 hover:text-gray-600 transition-all duration-150 text-[13px]"
                        >
                            X
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/**
 * - 함수 (onClose / onLoadModel / onUnloadModel) 참조 변경 무시
 * - 렌더 트리거 model.id / status / loadedTime, visible, loadingModelId 축소
 */
function propsEqual(prev: Props, next: Props) {
    return (
        prev.visible === next.visible &&
        prev.loadingModelId === next.loadingModelId &&
        prev.model.id === next.model.id &&
        prev.model.status === next.model.status &&
        prev.model.loadedTime === next.model.loadedTime
    )
}

export default memo(ModelPopupComp, propsEqual)