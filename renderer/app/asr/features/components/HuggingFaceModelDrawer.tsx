/** app/asr/features/components/HuggingFaceModelDrawer.tsx
 *  HuggingFace 모델 선택 드로어 컴포넌트
 *  모델 목록을 표시하고 선택할 수 있는 UI 제공
 */
'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import axios from 'axios'

import {
    HuggingFaceModel,
    fetchHuggingFaceModels,
    type FetchHFOptions,
} from '@/app/asr/features/utils/huggingFaceAPI'
import HuggingFaceModelCard from './HuggingFaceModelCard'
import ConfirmPopup from './ConfirmPopup'
import { useDownload } from './DownloadContext'
import { toast } from '@/app/common/toast/useToastStore'

interface HuggingFaceModelDrawerProps {
    open: boolean
    onClose: () => void
    onSelectModel: (model: HuggingFaceModel) => void
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

export default function HuggingFaceModelDrawer({ open, onClose, onSelectModel }: HuggingFaceModelDrawerProps) {
    const [models, setModels] = useState<HuggingFaceModel[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<FetchHFOptions['sortBy']>('downloads')

    const [visible, setVisible] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selected, setSelected] = useState<HuggingFaceModel | null>(null)

    const abortRef = useRef<AbortController | null>(null)
    const { addTask } = useDownload()

    const debouncedSearch = useDebounced(search, 350)

    useEffect(() => {
        setVisible(open)
    }, [open])

    useEffect(() => {
        if (!visible) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [visible]);

    useEffect(() => {
        if (!visible) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setVisible(false)
                onClose()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [visible, onClose])

    useEffect(() => {
        if (!visible) return
        setError(null)
        setLoading(true)

        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl

        fetchHuggingFaceModels({
            search: debouncedSearch || undefined,
            sortBy,
            limit: 48,
            signal: ctrl.signal,
            cacheTTL: 60_000,
        })
            .then(setModels)
            .catch((e) => {
                const any = e as any
                if (any?.name === 'CanceledError' || any?.name === 'AbortError' || any?.isCanceled) return
                setError('모델 목록 로드 실패')
                console.error('[HF] list error:', e)
            })
            .finally(() => setLoading(false))

        return () => ctrl.abort()
    }, [visible, debouncedSearch, sortBy])

    const handleCardClick = (m: HuggingFaceModel) => {
        setSelected(m)
        setConfirmOpen(true)
    }

    const handleConfirm = useCallback(async () => {
        if (!selected) return
        setConfirmOpen(false)

        try {
            addTask({
                id: selected.id,
                filename: selected.id,
                downloadFn: (onProgress, token, options) =>
                    axios
                        .post<{ path: string }>(
                            `${BASE_URL}/api/models/download-model`,
                            { model_id: selected.id },
                            {
                                responseType: 'blob',
                                cancelToken: token.token,
                                onDownloadProgress: (ev) => {
                                    if (typeof ev.loaded === 'number') {
                                        const total = typeof ev.total === 'number' && ev.total > 0 ? ev.total : ev.loaded
                                        onProgress(ev.loaded, total)
                                    }
                                },
                                headers: options?.hfToken ? { Authorization: `Bearer ${options.hfToken}` } : undefined,
                            }
                        )
                        .then((res) => res.data.path),
            })

            toast.success({
                title: '다운로드 시작',
                description: `"${selected.cardData?.pretty_name || selected.id}" 모델을 다운로드합니다.`,
                duration: 3000,
            })

            onSelectModel(selected)
            setVisible(false)
            onClose()
        } catch (e: any) {
            console.error('[HF] addTask failed:', e)
            toast.error({
                title: '시작 실패',
                description: e?.message ?? '다운로드를 시작하지 못했어요.',
            })
        }
    }, [selected, addTask, onSelectModel, onClose])

    const filtered = useMemo(() => {
        if (!search.trim()) return models
        const q = search.trim().toLowerCase()
        return models.filter(
            (m) =>
                m.id.toLowerCase().includes(q) ||
                (m.cardData?.pretty_name?.toLowerCase() ?? '').includes(q)
        )
    }, [models, search])

    const onBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setVisible(false)
            onClose()
        }
    }

    if (typeof window === 'undefined') return null

    const drawer = (
        <>
            <AnimatePresence onExitComplete={onClose}>
                {visible && (
                    <div
                        className="fixed inset-0 backdrop-blur-sm flex justify-end z-[9999]"
                        onMouseDown={onBackdropMouseDown}
                        aria-modal="true"
                        role="dialog"
                        aria-label="HuggingFace 모델 선택 드로어"
                    >
                        <motion.div
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="w-[400px] bg-white h-full shadow-lg overflow-hidden"
                        >
                            {/* 레이아웃: 헤더 고정 + 리스트 스크롤 */}
                            <div className="flex flex-col h-full">
                                {/* 헤더(고정) */}
                                <div className="shrink-0 p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg text-black font-bold">🤗 HuggingFace 모델 탐색</h3>
                                        <button
                                            className="w-[120px] py-2 bg-red-400 text-white rounded disabled:opacity-50"
                                            onClick={() => { setVisible(false); onClose() }}
                                        >
                                            닫기
                                        </button>
                                    </div>

                                    {/* 검색 / 정렬 */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="모델 검색..."
                                            className="flex-1 px-3 py-2 border rounded text-sm"
                                        />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as FetchHFOptions['sortBy'])}
                                            className="px-2 py-2 border rounded text-sm text-black"
                                            title="정렬 기준"
                                        >
                                            <option value="downloads">다운로드</option>
                                            <option value="likes">좋아요</option>
                                            <option value="id">이름</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 목록(스크롤 영역) */}
                                <div
                                    className={clsx('flex-1 min-h-0 overflow-y-auto p-4 scrollHFArea')}
                                    aria-label="HuggingFace 모델 목록"
                                >
                                    {loading ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
                                            ))}
                                        </div>
                                    ) : error ? (
                                        <div className="text-red-500">{error}</div>
                                    ) : filtered.length === 0 ? (
                                        <div className="text-sm text-gray-500">검색 결과가 없습니다.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {filtered.map((m) => (
                                                <HuggingFaceModelCard key={m.id} model={m} onSelect={handleCardClick} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 다운로드 확인 팝업 */}
            <ConfirmPopup
                open={confirmOpen}
                title="모델을 다운로드할까요?"
                description={`"${selected?.cardData?.pretty_name || selected?.id}"\n버튼을 누르면 모델 다운로드를 시작합니다.`}
                confirmText="예"
                cancelText="취소"
                type="info"
                onConfirm={handleConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    )

    return createPortal(drawer, document.body)
}

function useDebounced<T>(value: T, delay = 300): T {
    const [v, setV] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])
    return v
}