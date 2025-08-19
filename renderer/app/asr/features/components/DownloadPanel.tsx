// app/asr/features/components/DownloadPanel.tsx
'use client'

import React, { useEffect, useMemo } from 'react'
import { useDownload, DownloadTask } from './DownloadContext'
import {
    X,
    Download as DownloadIcon,
    CheckCircle2,
    AlertTriangle,
    Hourglass,
    ClipboardCopy
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import styles from './DownloadPanel.module.css'

function StatusIcon({ status }: { status: DownloadTask['status'] }) {
    switch (status) {
        case 'done':        return <CheckCircle2 className="text-green-500 w-4 h-4" />
        case 'in-progress': return <Hourglass className="text-yellow-500 w-4 h-4 animate-pulse" />
        case 'error':       return <AlertTriangle className="text-red-500 w-4 h-4" />
        case 'canceled':    return <X className="text-gray-400 w-4 h-4" />
        default:            return <DownloadIcon className="text-gray-400 w-4 h-4" />
    }
}

export function DownloadPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { tasks, removeTask, cancelIfRunning } = useDownload()
    const notify = useNotificationStore((s) => s.show)

    const electronAPI = useMemo(() => {
        if (typeof window === 'undefined') return undefined as any
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return (window as any).electronAPI
    }, [])
    const isElectronReady = !!(electronAPI?.openPath && electronAPI?.copyToClipboard)

    // ESC 키로 창 닫기
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleCopyPath = async (path?: string) => {
        if (!path) return notify('경로를 찾을 수 없습니다.', 'error')
        try {
            if (isElectronReady) {
                electronAPI.copyToClipboard(path)
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(path)
            } else {
                throw new Error('클립보드 API를 지원하지 않습니다.')
            }
            notify('경로가 클립보드에 복사되었습니다.', 'success')
        } catch {
            notify('경로 복사에 실패했습니다.', 'error')
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-[360px] bg-[#f8fafd] text-gray-800 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#e2e8f0] z-[9999]"
            >
                {/* 헤더 */}
                <div className="flex justify-between items-center p-4 border-b border-[#e2e8f0] bg-[#f1f5f9] rounded-t-xl">
                    <span className="font-semibold text-[15px] text-gray-700">Downloads</span>
                    <X
                        className="w-4 h-4 p-[2px] text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition cursor-pointer"
                        onClick={onClose}
                        aria-label="닫기"
                        role="button"
                    />
                </div>

                {/* 다운로드 리스트 */}
                <div className={clsx(styles.scrollContainer, 'px-4 py-3 space-y-3')}>
                    {tasks.length === 0 ? (
                        <div className="text-gray-500 text-sm">No active downloads</div>
                    ) : (
                        tasks.map((task: DownloadTask) => (
                            <div
                                key={task.id}
                                className={clsx(
                                    'p-3 rounded-lg border space-y-1 shadow-sm transition-all',
                                    {
                                        'bg-[#f0fdf4] border-green-200': task.status === 'done',
                                        'bg-[#fff7ed] border-yellow-200': task.status === 'in-progress',
                                        'bg-[#fef2f2] border-red-200': task.status === 'error',
                                        'bg-white border-gray-200': task.status === 'canceled',
                                    }
                                )}
                            >
                                {/* 파일명 + 취소 */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon status={task.status} />
                                        <div>
                                            <div className="text-sm font-medium text-gray-800">
                                                {task.filename}
                                            </div>
                                            <div className="relative overflow-hidden max-w-[240px] h-[20px] group">
                                                <div className="animate-marquee text-xs text-gray-500">
                                                    {task.fullLabel}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                    {(task.status === 'done' || task.status === 'error' || task.status === 'canceled') && (
                                            <>
                                                {task.status === 'done' && task.path && (
                                                    <button
                                                        onClick={() => handleCopyPath(task.path)}
                                                        title="경로 복사"
                                                        aria-label="경로 복사"
                                                    >
                                                        <ClipboardCopy className="w-4 h-4 text-gray-400 hover:text-black" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => 
                                                        removeTask(task.id)
                                                    }
                                                    title="목록에서 제거"
                                                    aria-label="목록에서 제거"
                                                >
                                                    <X className="w-4 h-4 text-gray-400 hover:text-black" />
                                                </button>
                                            </>
                                        )}

                                        {task.status === 'in-progress' && (
                                            <button
                                                onClick={async () => {
                                                    // 로컬 취소 + 서버 취소
                                                    cancelIfRunning(task.id)
                                                    try {
                                                        await fetch('http://localhost:8000/api/models/cancel-download', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ model_id: task.id })
                                                        })
                                                    } catch (err) {
                                                        console.warn('백엔드 취소 실패:', err)
                                                    }
                                                    // notify(`${task.filename} 다운로드 취소됨`, 'info')
                                                }}
                                                title="다운로드 취소"
                                                aria-label="다운로드 취소"
                                            >
                                                <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 프로그레스 바 */}
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden" aria-hidden>
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${task.progress}%`,
                                            backgroundColor:
                                                task.status === 'done' ? '#22c55e' :
                                                task.status === 'in-progress' ? '#3b82f6' :
                                                task.status === 'error' ? '#ef4444' : '#9ca3af'
                                        }}
                                    />
                                </div>

                                {/* 상태 · 크기 · 속도 · ETA */}
                                <div className="text-xs text-gray-500 space-y-0.5">
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <div>
                                            {task.status === 'in-progress'
                                                ? `${task.progress}% 다운로드 중`
                                                : task.status === 'done'
                                                ? '다운로드 완료'
                                                : task.status === 'canceled'
                                                ? '다운로드 취소됨'
                                                : '오류'}
                                        </div>

                                        {task.status === 'done' && (
                                            <span className="ml-2 bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium text-[11px]">
                                                완료
                                            </span>
                                        )}
                                    </div>

                                    {task.status === 'done' && task.sizeMB !== undefined && (
                                        <div>
                                            총 크기:{' '}
                                            {task.sizeMB >= 1024
                                                ? `${(task.sizeMB / 1024).toFixed(2)} GB`
                                                : `${task.sizeMB.toFixed(2)} MB`}
                                        </div>
                                    )}

                                    {task.status === 'in-progress' && task.speedMBps !== undefined && (
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span>남은 시간: {task.etaSec}초</span>
                                            <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                {task.speedMBps.toFixed(2)} MB/s
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {task.path && task.status === 'done' && (
                                    <button
                                        onClick={() => {
                                            if (isElectronReady) {
                                                electronAPI.openPath(task.path!)
                                            } else {
                                                notify('Electron 환경이 아니라 경로 열기를 사용할 수 없습니다.', 'error')
                                            }
                                        }}
                                    >
                                        Open in File Explorer
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Downloads 디렉토리 버튼 */}
                <div className="border-t border-[#e2e8f0] p-3 text-right bg-[#f1f5f9] rounded-b-xl">
                {isElectronReady ? (
                    <button
                        onClick={() => {
                            window.electronAPI.openPath('\\\\wsl.localhost\\Ubuntu-24.04\\home\\dael\\arielle_backend\\hf_cache')
                        }}
                        className="text-sm hover:underline text-indigo-500"
                    >
                        Open Cache Directory
                    </button>
                ) : (
                    <div className="text-xs text-gray-400">Cache path not available</div>
                )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}