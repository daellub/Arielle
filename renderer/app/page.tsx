// app/page.tsx
'use client'

import Sidebar from '@/app/features/asr/components/Sidebar'
import Models from '@/app/features/asr/components/Models'
import MicStatus from '@/app/features/asr/components/MicStatus'
import LiveTranscriptPanel from '@/app/features/asr/components/LiveTranscriptPanel'
import SystemStatus from './features/asr/components/Status'
import SystemLog from './features/asr/components/SystemLog'

import { useMicInputLevel } from '@/app/features/asr/hooks/useMicInputLevel'
import { useMicStore } from '@/app/features/asr/store/useMicStore'
import { useEffect } from 'react'

export default function Home() {
    const { 
        deviceId, 
        deviceName,
        recordStatus,
        processStatus,
        inputThreshold
    } = useMicStore()
    
    const inputLevel = useMicInputLevel(deviceId)

    useEffect(() => {
        setTimeout(() => {
            useMicStore.getState().setRecordStatus('input') // TODO: 실시간 수정
            useMicStore.getState().setProcessStatus('ready') // TODO: 실시간 수정
        }, 1000)
    }, [])

    return (
        <div className="flex bg-white">
            <Sidebar />
            <Models />
            <div className='p-6'>
                <main className='flex-1 p-5'>
                    <h1 className='text-[30px] text-black'>ASR Management</h1>
                </main>

                <div className='flex gap-4'>
                    <MicStatus />
                    <LiveTranscriptPanel />
                </div>
                <div className='flex gap-4'>
                    <SystemStatus />
                    <SystemLog />
                </div>
            </div>
        </div>
    )
}