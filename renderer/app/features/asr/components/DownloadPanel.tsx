// app/features/asr/components/DownloadPanel.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useDownload, DownloadTask } from './DownloadContext'
import {
    X,
    Download,
    CheckCircle2,
    AlertTriangle,
    Hourglass,
    ClipboardCopy
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'

import Notification from './Notification'
import styles from './DownloadPanel.module.css'

export function DownloadPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { tasks, removeTask } = useDownload()
    const [isElectronReady, setElectronReady] = useState(false)
    const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)

    useEffect(() => {
        const ready = typeof window !== 'undefined' &&
            'electronAPI' in window &&
            typeof window.electronAPI?.openPath === 'function'

        setElectronReady(ready)
    }, [])

    if (!isOpen) return null

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done': return <CheckCircle2 className="text-green-500 w-4 h-4" />
            case 'in-progress': return <Hourglass className="text-yellow-500 w-4 h-4 animate-pulse" />
            case 'error': return <AlertTriangle className="text-red-500 w-4 h-4" />
            case 'canceled': return <X className="text-gray-400 w-4 h-4" />
            default: return <Download className="text-gray-400 w-4 h-4" />
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
                                        {getStatusIcon(task.status)}
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
                                                        onClick={() => {
                                                            if (task.path) {
                                                                window.electronAPI.copyToClipboard(task.path!)
                                                                setNotification({ message: '경로가 복사되었습니다.', type: 'success' })
                                                            } else {
                                                                setNotification({ message: '경로를 찾을 수 없습니다.', type: 'error' })
                                                                console.warn('❌ 경로가 비어있음')
                                                            }
                                                        }}
                                                        title="Copy path"
                                                    >
                                                        <ClipboardCopy className="w-4 h-4 text-gray-400 hover:text-black" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => 
                                                        removeTask(task.id)
                                                    }
                                                    title='목록에서 제거'
                                                >
                                                    <X className="w-4 h-4 text-gray-400 hover:text-black" />
                                                </button>
                                            </>
                                        )}

                                        {task.status === 'in-progress' && (
                                            <button
                                                onClick={async () => {
                                                    task.cancelToken?.cancel('사용자 취소')
                                                    removeTask(task.id)
                                                    try {
                                                        await fetch('http://localhost:8000/api/models/cancel-download', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ model_id: task.id })
                                                        })
                                                    } catch (err) {
                                                        console.warn('백엔드 취소 실패:', err)
                                                    }
                                                    setNotification({ message: `${task.filename} 다운로드 취소됨`, type: 'info' })
                                                }}
                                                title="다운로드 취소"
                                            >
                                                <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 프로그레스 바 */}
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
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
                                        onClick={() => window.electronAPI.openPath(task.path!)}
                                        className="text-[12px] text-indigo-500 hover:underline mt-1"
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
                            window.electronAPI.openPath('C:\\Users\\zebri\\Desktop\\Dael\\Project\\arielle-app\\.hf_cache')
                        }}
                        className="text-sm hover:underline text-indigo-500"
                    >
                        Open Cache Directory
                    </button>
                ) : (
                    <div className="text-xs text-gray-400">Cache path not available</div>
                )}
                </div>
                <AnimatePresence>
                    {notification && (
                        <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    )
}