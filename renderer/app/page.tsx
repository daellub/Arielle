// app/page.tsx
'use client'

import { AnimatePresence } from 'motion/react'

import Sidebar from '@/app/features/asr/components/Sidebar'
import Models from '@/app/features/asr/components/Models'
import MicStatus from '@/app/features/asr/components/MicStatus'
import LiveTranscriptPanel from '@/app/features/asr/components/LiveTranscriptPanel'
import SystemStatus from './features/asr/components/Status'
import SystemLog from './features/asr/components/SystemLog'

import { useMicInputLevel } from '@/app/features/asr/hooks/useMicInputLevel'
import { useMicStore } from '@/app/features/asr/store/useMicStore'
import { useEffect, useState, useRef } from 'react'
import StatusFetcher from './features/asr/components/StatusFetcher'
import { DownloadPanel } from './features/asr/components/DownloadPanel'
import { DownloadProvider } from './features/asr/components/DownloadContext'
import Notification from './features/asr/components/Notification'

export default function Home() {
    const { 
        deviceId,
    } = useMicStore()
    
    const inputLevel = useMicInputLevel(deviceId)

    const [isDownloadOpen, setDownloadOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const [pendingNotification, setPendingNotification] = useState<null | { message: string; type?: 'success' | 'info' }>(null)
    const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'info' } | null>(null)

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
        if (pendingNotification) {
            setNotification(pendingNotification)
            setPendingNotification(null)
        }
    }, [pendingNotification])

    return (
        <DownloadProvider
            onDownloadStart={(task) => {
                setTimeout(() => {
                    setPendingNotification({
                        message: `'${task.filename}' 다운로드 시작`,
                        type: 'info',
                    })
                }, 0)
            }}
            onDownloadComplete={(task) => {
                setTimeout(() => {
                    setPendingNotification({
                        message: `'${task.filename}' 다운로드 완료`,
                        type: 'success',
                    })
                }, 0)
            }}
        >
            <div className="flex bg-white">
                <Sidebar />
                <Models />
                <div className='space-y-[-7.883px] p-6'>
                    <header className="relative p-5 flex justify-between items-center">
                        <h1 className="text-[30px] text-black">ASR Management</h1>
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

            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </DownloadProvider>
    )
}