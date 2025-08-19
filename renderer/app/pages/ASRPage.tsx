// app/pages/ASRPage.tsx
'use client'

import axios from 'axios'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// 정적
import Models from '@/app/asr/features/components/Models'
import MicStatus from '@/app/asr/features/components/MicStatus'
import LiveTranscriptPanel from '@/app/asr/features/components/LiveTranscriptPanel'
import SystemStatus from '@/app/asr/features/components/Status'
import SystemLog from '@/app/asr/features/components/SystemLog'
import StatusFetcher from '@/app/asr/features/components/StatusFetcher'
import ModalPortal from '@/app/components/ui/ModalPortal'

// 훅 / 스토어 / 유틸리티
import { DownloadProvider } from '@/app/asr/features/components/DownloadContext'
import { fetchModels } from '@/app/asr/features/utils/api'
import { Model } from '@/app/asr/features/types/Model'
import { useNotificationStore } from '@/app/store/useNotificationStore'

const LoadingFallback = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-lg bg-white shadow-md">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-gray-700 font-medium">Loading…</span>
        </div>
    </div>
)

const SettingsPanel  = dynamic(() => import('@/app/asr/features/components/Settings'), { ssr: false, loading: LoadingFallback })
const AddModel       = dynamic(() => import('@/app/asr/features/components/AddModel'), { ssr: false, loading: LoadingFallback })
const ModelInfoPopup = dynamic(() => import('@/app/asr/features/components/ModelInfoPopup'), { ssr: false, loading: LoadingFallback })
const ConfirmPopup   = dynamic(() => import('@/app/asr/features/components/ConfirmPopup'), { ssr: false, loading: LoadingFallback })

import styles from './ASRPage.module.css'

interface Sparkle {
    top: string
    left: string
    delay: string
    duration: string
}

const MESSAGE_MAP: Record<'refresh'|'add'|'delete'|'manual'|'load'|'unload', string> = {
    refresh: '모델 상태를 갱신했습니다.',
    add:     '모델을 추가했습니다.',
    delete:  '모델을 삭제했습니다.',
    manual:  '모델 목록을 불러왔습니다.',
    load:    '모델을 로드했습니다.',
    unload:  '모델을 언로드했습니다.',
}

function shallowEqualModels(a: Model[], b: Model[]) {
    if (a === b) return true
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        const x = a[i], y = b[i]
        if (!x || !y) return false
        if (
            x.id !== y.id ||
            x.status !== y.status ||
            x.name !== y.name ||
            x.framework !== y.framework ||
            x.language !== y.language ||
            x.latency !== y.latency
        ) return false
    }
    return true
}

export default function ASRPage() {
    const [models, setModels] = useState<Model[]>([])

    const [showSettings, setShowSettings] = useState(false)
    const [showAddModel, setShowAddModel] = useState(false)
    const [showModelInfo, setShowModelInfo] = useState(false)
    const [infoModel, setInfoModel] = useState<Model | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [modelToDelete, setModelToDelete] = useState<Model | null>(null)

    const [isDownloadOpen, setDownloadOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const notify = useNotificationStore((s) => s.show)

    const openSettings   = useCallback(() => setShowSettings(true), [])
    const openAddModel   = useCallback(() => setShowAddModel(true), [])
    const openModelInfo  = useCallback((model: Model) => { setInfoModel(model); setShowModelInfo(true) }, [])
    const askDeleteModel = useCallback((model: Model) => { setModelToDelete(model); setShowDeleteConfirm(true) }, [])

    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    // 스파클 생성
    const sparkles = useMemo<Sparkle[]>(
        () => Array.from({ length: 20}, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${3 + Math.random() * 2}s`,
        })),
        [mounted]
    )

    const refreshModels = useCallback(async (
        context: 'refresh' | 'add' | 'delete' | 'manual' | 'load' | 'unload' = 'refresh'
    ) => {
        try {
            const data = await fetchModels()
            setModels(prev => shallowEqualModels(prev, data) ? prev : data)
            useNotificationStore.getState().show(MESSAGE_MAP[context], 'info')
        } catch (err) {
            console.error("모델 목록 갱신 실패:", err)
            useNotificationStore.getState().show('모델 목록을 불러오지 못했습니다.', 'error')
        }
    }, [])

    const closeModelInfo = useCallback(() => {
        setShowModelInfo(false)
        setTimeout(() => setInfoModel(null), 300)
    }, [])

    const deleteModel = useCallback(async (modelId: string) => {
        const res = await axios.delete(`http://localhost:8000/asr/models/${modelId}`)
        if (res.status !== 200) throw new Error("모델 삭제 실패")
    }, [])

    useEffect(() => {
        if (!isDownloadOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setDownloadOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isDownloadOpen])

    // 모델 최초 로드
    const didLoadOnce = useRef(false)
    useEffect(() => {
        if (didLoadOnce.current) return
        didLoadOnce.current = true

        refreshModels('refresh')
    }, [refreshModels])

    const anyModalOpen = showSettings || showAddModel || showModelInfo || showDeleteConfirm
    useEffect(() => {
        if (anyModalOpen) document.body.classList.add('overflow-hidden')
        else document.body.classList.remove('overflow-hidden')
        return () => document.body.classList.remove('overflow-hidden')
    }, [anyModalOpen])

    useEffect(() => {
        const idle = (cb: () => void) =>
            (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 500)
        idle(() => {
            import('@/app/asr/features/components/Settings')
            import('@/app/asr/features/components/AddModel')
            import('@/app/asr/features/components/ModelInfoPopup')
            import('@/app/asr/features/components/ConfirmPopup')
            import('@/app/asr/features/components/DownloadPanel')
        })
    }, [])

    return (
        <DownloadProvider>
            <div className={styles.container + " w-full h-full flex flex-col overflow-hidden"}>
                {mounted && sparkles.map((s, i) => (
                    <div
                        key={i}
                        role="presentation"
                        className={styles.sparkle}
                        style={{
                            top: s.top,
                            left: s.left,
                            animationDelay: s.delay,
                            animationDuration: s.duration,
                        }}
                    />
                ))}

                {/* 메인 콘텐츠 */}
                <div
                    className={
                        "flex-1 overflow-y-auto relative z-10 flex p-6 transition-[opacity] duration-150 " +
                        (anyModalOpen ? "pointer-events-none select-none opacity-70" : "opacity-100")
                    }
                    aria-hidden={anyModalOpen}
                >
                    <Models 
                        onOpenSettings={openSettings}
                        onOpenAddModel={openAddModel}
                        onOpenModelInfo={openModelInfo}
                        onRequestDelete={askDeleteModel}
                        models={models}
                        refreshModels={refreshModels}
                    />
                    <div className='space-y-[-7.883px] p-6'>
                        <header className="relative p-5 flex justify-between items-center">
                            <h1 className="text-[30px] text-gray-700">ASR Management</h1>
                        </header>

                        <div className='flex gap-4'>
                            <MicStatus />
                            <LiveTranscriptPanel />
                        </div>
                        <div className='flex gap-4'>
                            <StatusFetcher />
                            <SystemStatus />
                            <SystemLog />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 모달 */}
            {showSettings && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[9999]">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="pointer-events-auto">
                                <SettingsPanel onClose={() => setShowSettings(false)} />
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
            {showAddModel && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[9999]">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="pointer-events-auto">
                                <AddModel
                                    open
                                    onClose={() => setShowAddModel(false)}
                                    onModelAdded={() => { setShowAddModel(false); refreshModels('add') }}
                                />
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
            {showModelInfo && infoModel && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[9999]">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="pointer-events-auto">
                                <ModelInfoPopup model={infoModel} visible onClose={closeModelInfo} />
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
            {showDeleteConfirm && modelToDelete && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[9999]">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="pointer-events-auto">
                                <ConfirmPopup
                                    open
                                    title="모델 삭제"
                                    description={`정말 "${modelToDelete.name}" 모델을 삭제하시겠습니까?`}
                                    confirmText="삭제"
                                    cancelText="취소"
                                    type="danger"
                                    onConfirm={async () => {
                                        try { await deleteModel(modelToDelete.id); refreshModels('delete') }
                                        catch { notify('모델 삭제 실패', 'error') }
                                        finally { setShowDeleteConfirm(false); setModelToDelete(null) }
                                    }}
                                    onCancel={() => { setShowDeleteConfirm(false); setModelToDelete(null) }}
                                />
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </DownloadProvider>
    )
}