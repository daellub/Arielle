// app/asr/features/components/ModelInfoPopup.tsx
'use client'

import React, { useEffect, useMemo, useCallback, useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'motion/react'
import { HardDrive, X, Cpu, BookOpenCheck, Languages, Power, Settings2, Laptop } from 'lucide-react'
import { Model } from '@/app/asr/features/types/Model'

interface ModelInfoPopupProps {
    model: Model | null
    visible: boolean
    onClose: () => void
}

// 상태 별 색상
const STATUS_CLASS: Record<string, string> = {
    active: 'bg-green-500/20 text-green-300',
    loading: 'bg-blue-500/20 text-blue-300',
    error: 'bg-red-500/20 text-red-300',
    idle: 'bg-gray-500/20 text-gray-500',
}

// 공통 클래스
const WRAP_BASE =
    'fixed inset-0 flex items-center justify-center z-[999]'
const CARD_BASE =
    'flex rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 ' +
    'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all duration-300'
const ROW_BASE =
    'flex items-center gap-3 p-2 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm ' +
    'shadow-sm hover:bg-white/20 hover:shadow-md transition-all duration-200'
const DETAIL_BASE =
    'absolute top-6 left-[420px] w-[300px] p-4 bg-white/10 backdrop-blur-lg border border-white/20 ' +
    'rounded-lg shadow-lg text-sm text-white will-change-transform will-change-opacity'

// 정보 리스트
const InfoRow = React.memo(function InfoRow({
    icon: Icon,
    label,
    value,
    color,
    pulse = false,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
    value: React.ReactNode
    color: string
    pulse?: boolean
}) {
    return (
        <div className={ROW_BASE}>
            <Icon className={clsx('w-4 h-4', color, pulse && 'animate-pulse')} />
            <span>
                <strong>{label}:</strong> {value}
            </span>
        </div>
    )
})

export default function ModelInfoPopup({
    model,
    visible,
    onClose
}: ModelInfoPopupProps) {
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        if (!visible) setShowDetails(false)
    }, [visible])

    useEffect(() => {
        if (!visible) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [visible, onClose])

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose()
        },
        [onClose]
    )

    const toggleDetails = useCallback(() => setShowDetails(v => !v), [])

    const infoItems = useMemo(
        () => [
            { icon: BookOpenCheck, label: '이름', value: model?.name, color: 'text-blue-400' },
            { icon: Settings2, label: '타입', value: model?.type, color: 'text-purple-400' },
            { icon: Languages, label: '언어', value: model?.language, color: 'text-pink-400' },
            { icon: Cpu, label: '프레임워크', value: model?.framework, color: 'text-indigo-400' },
            { icon: Laptop, label: '디바이스', value: model?.device, color: 'text-yellow-400' },
        ],
        [model]
    )

    // prefers-reduced-motion 대응
    const transition = useMemo(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? { duration: 0 }
                : { duration: 0.28, ease: 'easeOut' as const },
        []
    )

    if (!visible || !model) return null

    const statusClass = STATUS_CLASS[model.status] ?? STATUS_CLASS.idle

    return (
        <AnimatePresence>
            {/* 팝업 컨테이너 */}
            <motion.div
                key='popup'
                className={WRAP_BASE}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
                aria-modal='true'
                role='dialog'
                aria-label='모델 정보'
                onMouseDown={handleBackdropClick}
            >

                {/* 카드 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={transition}
                    className={clsx(
                        CARD_BASE,
                        'relative',
                        showDetails ? 'w-[760px]' : 'w-[400px]'
                    )}
                >
                    {/* 좌측 */}
                    <div className='w-[400px] p-6'>
                        <div className='flex justify-between items-center mb-4'>
                            <div className='flex items-center gap-2'>
                                {/* 상태 감지 펄스 아이콘 */}
                                <HardDrive
                                    className={clsx(
                                        'w-4 h-4',
                                        (model.status === 'active' || model.status === 'loading') && 'animate-pulse'
                                    )}
                                />
                                <h3 className='text-xl font-bold text-black tracking-wide'>
                                    모델 정보
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className='text-gray-500 hover:text-gray-800 transition-all p-1 rounded-full'
                                title='닫기'
                                aria-label='닫기'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='space-y-3 text-sm text-gray-700 mt-4'>
                            {infoItems.map((it, i) => (
                                <InfoRow
                                    key={i}
                                    icon={it.icon}
                                    label={it.label}
                                    value={it.value ?? '-'}
                                    color={it.color}
                                />
                            ))}

                            <div className={ROW_BASE}>
                                <Power className='w-4 h-4 text-gray-500' />
                                <span
                                    className={clsx(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                                        statusClass
                                    )}
                                >
                                    {model.status}
                                </span>
                            </div>
                        </div>

                        <div className='mt-4 text-right'>
                            <button
                                onClick={toggleDetails}
                                className='text-xs text-blue-500 hover:underline'
                                aria-expanded={showDetails}
                                aria-controls='model-detail-panel'
                            >
                                {showDetails ? '간단히 보기' : '자세히 보기'}
                            </button>
                        </div>
                    </div>

                    {/* 우측 */}
                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                key='detail'
                                id='model-detail-panel'
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                transition={transition}
                                className={DETAIL_BASE}
                            >
                                {model.config ? (
                                    <pre className='whitespace-pre-wrap text-xs leading-relaxed'>
                                        {JSON.stringify(model.config, null, 2)}
                                    </pre>
                                ) : (
                                    <p className='text-xs text-gray-800 italic'>
                                        추가 설정을 지원하지 않는 모델입니다.
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
