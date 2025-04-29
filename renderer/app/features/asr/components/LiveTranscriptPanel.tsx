// app/components/LiveTranscriptPanel.tsx
'use client'

import { io, Socket } from 'socket.io-client'
import React, { useState } from 'react'
import { AnimatePresence } from 'motion/react'

import { useMicStore } from '@/app/features/asr/store/useMicStore'
import { Transcript, useTranscriptStore } from '@/app/features/asr/store/useTranscriptStore'
import { useSelectedModelStore } from '@/app/features/asr/store/useSelectedModelStore'
import Notification from './Notification'

let socket: Socket

export default function LiveTranscriptPanel() {
    const { 
        setTranscript,
        stopTranscript,
        finalizeTranscript,
        clearTranscript,
        currentTranscript,
        history
    } = useTranscriptStore()

    const { selectedModel } = useSelectedModelStore()

    const [isConnected, setIsConnected] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [notification, setNotification] = useState<{
        message: string
        type?: 'success' | 'error' | 'info'
    } | null>(null)

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 2500)
    } 

    const handleStart = () => {
        if (!selectedModel || selectedModel.status !== 'active') {
            showNotification('모델이 선택되지 않았거나 로드되지 않았습니다.', 'info')
            return
        }

        if (isConnected) {
            showNotification('이미 연결된 상태입니다.', 'error')
            return
        }

        socket = io('http://localhost:8000', {
            path: "/socket.io",
            transports: ['websocket'],
            autoConnect: false,
            withCredentials: true,
        })

        socket.connect()

        socket.on('recognizing', (data: { text: string }) => {
            setTranscript(data.text)
        })

        socket.on('recognized', (data: { text: string}) => {
            finalizeTranscript()
        })

        socket.on('connect', async () => {
            // console.log('[SOCKET] 연결 성공')
            setIsConnected(true)
            showNotification('Socket과 연결되었습니다.', 'success')

            if (selectedModel.framework === 'Azure') {
                socket.emit('start_azure_mic', { model_id: selectedModel.id });
            } else {
                socket.emit('start_transcribe', { model_id: selectedModel.id });
            }
            setIsRecording(true)
        })

        socket.on('disconnect', () => {
            // console.log('[SOCKET] 연결 종료')
            setIsConnected(false)
            showNotification('Socket과 연결을 종료했습니다.', 'success')
        })

        socket.on('error', (err) => {
            // console.error('[SOCKET] 오류 발생: ', err)
            showNotification('Socket과 연결 중 오류가 발생했습니다.', 'error')
        })
    }

    const handleStop = () => {
        if (!selectedModel || selectedModel.status !== 'active') {
            showNotification('모델이 선택되지 않았거나 종료된 상태입니다.', 'info')
            return
        }
        if (socket) {
            // console.log('소켓 연결 상태:', socket.connected)
            if (selectedModel.framework === 'Azure') {
                socket.emit('stop_azure_mic', {});
            } else {
                socket.emit('stop_transcribe', {});
            }
            setIsConnected(false);
            setIsRecording(false);
        }
        showNotification('Socket과 연결을 종료했습니다.', 'success')
    }

    const handleReset = () => {
        showNotification('전사된 텍스트를 초기화했습니다.', 'info')
        clearTranscript()
    }

    return (
        <>
            <div className='max-w-[600px] min-w-[600px] max-h-[250px] p-7 rounded-[30px] bg-white shadow-md border border-gray-200'>
                <div className='flex items-center justify-between mb-3'>
                    <span className='text-[18px] font-semibold text-black'>LIVE Transcribe</span>
                    <div className='flex gap-10 text-sm'>
                        <ControlButton color='bg-green-400' label='시작' onClick={handleStart} />
                        <ControlButton color='bg-blue-400' label='초기화' onClick={handleReset} />
                        <ControlButton color='bg-rose-400' label='중지' onClick={handleStop} />
                    </div>
                </div>

                <hr className='border-t border-gray-300 mb-3' />

                <div className='mb-4'>
                    <div className='text-[14px] text-black mb-1'>실시간 텍스트</div>
                    <div className='text-[16px font-mono text-neutral-600'>
                        {currentTranscript ? currentTranscript.text : (isConnected ? '✅ 실시간 텍스트 수신 중...' : '🟡 연결되지 않음. 시작을 눌러주세요.')}
                    </div>
                </div>

                <div className='text-sm text-neutral-500'>
                    <div className='mb-1'>인식 로그</div>
                    <ul className='space-y-1 pl-3 list-disc'>
                        {history.map((item, index) => (
                            <li key={index}>
                                '{item.text}' ({item.lang}) - {item.timestamp}
                            </li>
                        ))}
                    </ul>
                </div>
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
        </>
    )
}

function ControlButton({ color, label, onClick }: {color: string; label: string; onClick?: () => void }) {
    return (
        <div 
            className='flex items-center gap-1 cursor-pointer select-none hover:opacity-80'
            onClick={onClick}
        >
            <div className={`w-[15px] h-[15px] rounded-full ${color}`} />
            <span className='text-black'>{label}</span>
        </div>
    )
}