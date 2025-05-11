// app/page.tsx
'use client'

import axios from 'axios'
import { useEffect, useState, useRef } from 'react'

import Models from '@/app/asr/features/components/Models'
import MicStatus from '@/app/asr/features/components/MicStatus'
import LiveTranscriptPanel from '@/app/asr/features/components/LiveTranscriptPanel'
import SystemStatus from '@/app/asr/features/components/Status'
import SystemLog from '@/app/asr/features/components/SystemLog'
import SettingsPanel from '@/app/asr/features/components/Settings'
import AddModel from '@/app/asr/features/components/AddModel'
import ModelInfoPopup from '@/app/asr/features/components/ModelInfoPopup'
import ConfirmPopup from '@/app/asr/features/components/ConfirmPopup'

import { useMicInputLevel } from '@/app/asr/features/hooks/useMicInputLevel'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { fetchModels } from '@/app/asr/features/utils/api'
import { Model } from '@/app/asr/features/types/Model'
import StatusFetcher from '@/app/asr/features/components/StatusFetcher'
import { DownloadPanel } from '@/app/asr/features/components/DownloadPanel'
import { DownloadProvider } from '@/app/asr/features/components/DownloadContext'
import { useNotificationStore } from '@/app/store/useNotificationStore'

import styles from './ASRPage.module.css'

interface Sparkle {
    top: string
    left: string
    delay: string
    duration: string
}

export default function Home() {
    const { 
        deviceId,
    } = useMicStore()
    
    const inputLevel = useMicInputLevel(deviceId)

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

    const [sparkles, setSparkles] = useState<Sparkle[]>([])

    
    const refreshModels = async (context: 'refresh' | 'add' | 'delete' | 'manual' | 'load' | 'unload' = 'manual') => {
        try {
            const data = await fetchModels()
            setModels(data)

            const messageMap = {
                refresh: '모델 상태를 갱신했습니다.',
                add: '모델을 추가했습니다.',
                delete: '모델을 삭제했습니다.',
                manual: '모델 목록을 불러왔습니다.',
                load: '모델을 로드했습니다.',
                unload: '모델을 언로드했습니다.',
            }

            notify(messageMap[context], 'info')
        } catch (err) {
            console.error("모델 목록 갱신 실패:", err)
            notify('모델 목록을 불러오지 못했습니다.', 'error')
        }
    }

    const closeModelInfo = () => {
        setShowModelInfo(false)
        setTimeout(() => setInfoModel(null), 300)
    }

    const deleteModel = async (modelId: string) => {
        const res = await axios.delete(`http://localhost:8000/asr/models/${modelId}`)
        if (res.status !== 200) throw new Error("모델 삭제 실패")
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setDownloadOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        setTimeout(() => {
            useMicStore.getState().setRecordStatus('input') // TODO: 실시간 수정
            useMicStore.getState().setProcessStatus('ready') // TODO: 실시간 수정
        }, 1000)
    }, [])

    useEffect(() => {
        refreshModels('manual')
    }, [])

    useEffect(() => {
        const generated = Array.from({ length: 20 }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${3 + Math.random() * 2}s`,
        }))
        setSparkles(generated)
    }, [])

    return (
        <DownloadProvider
            onDownloadStart={(task) => {
                setTimeout(() => {
                    notify(`'${task.filename}' 다운로드 시작`, 'info')
                }, 0)
            }}
            onDownloadComplete={(task) => {
                setTimeout(() => {
                    notify(`'${task.filename}' 다운로드 완료`, 'success')
                }, 0)
            }}
        >
            <div className={styles.container}>
                {sparkles.map((s, i) => (
                    <div
                        key={i}
                        className={styles.sparkle}
                        style={{
                            top: s.top,
                            left: s.left,
                            animationDelay: s.delay,
                            animationDuration: s.duration,
                        }}
                    />
                ))}
            
                <div className="relative z-10 flex p-6">
                    <Models 
                        onOpenSettings={() => setShowSettings(true)} 
                        onOpenAddModel={() => setShowAddModel(true)}
                        onOpenModelInfo={(model) => {
                            setInfoModel(model)
                            setShowModelInfo(true)
                        }}
                        onRequestDelete={(model) => {
                            setModelToDelete(model)
                            setShowDeleteConfirm(true)
                        }}
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
                        <div className='flex gap-2'>
                            <StatusFetcher />
                            <SystemStatus />
                            <SystemLog />
                        </div>
                    </div>
                </div>

                <div ref={panelRef}>
                    <DownloadPanel isOpen={isDownloadOpen} onClose={() => setDownloadOpen(false)} />
                </div>
            </div>
            {showSettings && (
                <>
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]" />
                    <div className="fixed inset-0 z-[9999]">
                    <SettingsPanel onClose={() => setShowSettings(false)} />
                    </div>
                </>
            )}
            {showAddModel && (
                <>
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]" />
                        <AddModel
                        open={true}
                        onClose={() => setShowAddModel(false)}
                        onModelAdded={() => {
                            setShowAddModel(false)
                            refreshModels('add')
                        }}
                    />
                </>
            )}
            {showModelInfo && infoModel && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[998]" />
                    <div className="fixed inset-0 z-[9999]">
                    <ModelInfoPopup
                        model={infoModel}
                        visible={true}
                        onClose={closeModelInfo}
                    />
                    </div>
                </>
            )}
            {showDeleteConfirm && modelToDelete && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-[998]" />
                    <div className="fixed inset-0 z-[9999] flex justify-center items-center">
                    <ConfirmPopup
                        open={true}
                        title="모델 삭제"
                        description={`정말 "${modelToDelete.name}" 모델을 삭제하시겠습니까?`}
                        confirmText="삭제"
                        cancelText="취소"
                        type="danger"
                        onConfirm={async () => {
                            try {
                                await deleteModel(modelToDelete.id)
                                refreshModels('delete')
                            } catch (err) {
                                notify('모델 삭제 실패', 'error')
                            } finally {
                                setShowDeleteConfirm(false)
                                setModelToDelete(null)
                            }
                        }}
                        onCancel={() => {
                            setShowDeleteConfirm(false)
                            setModelToDelete(null)
                        }}
                    />
                    </div>
                </>
            )}
        </DownloadProvider>
    )
}