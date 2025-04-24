// app/page.tsx
'use client'

import Sidebar from './components/Sidebar'
import Models from './components/Models'
import MicStatus from './components/MicStatus'
import LiveTranscriptPanel from './components/LiveTranscriptPanel'

import { useMicInputLevel } from './hooks/useMicInputLevel'
import { useMicStore } from './store/useMicStore'
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
            </div>
        </div>
    )
}