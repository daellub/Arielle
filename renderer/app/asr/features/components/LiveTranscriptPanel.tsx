// app/asr/features/components/LiveTranscriptPanel.tsx
'use client'

import { io, Socket } from 'socket.io-client'
import React, { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import axios from 'axios'

import { useRecordingStore } from '@/app/store/useRecordingStore'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { Transcript, useTranscriptStore } from '@/app/asr/features/store/useTranscriptStore'
import { useSelectedModelStore } from '@/app/asr/features/store/useSelectedModelStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'

export default function LiveTranscriptPanel() {
    const { 
        setTranscript,
        stopTranscript,
        finalizeTranscript,
        clearTranscript,
        currentTranscript,
        history
    } = useTranscriptStore()

    const { deviceId, deviceName } = useMicStore()

    const { selectedModel } = useSelectedModelStore()

    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const isRecording = useRecordingStore.getState().isRecording

    const setRecording = useRecordingStore((s) => s.setRecording)

    const notify = useNotificationStore((s) => s.show)

    const handleStart = () => {
        if (!selectedModel || selectedModel.status !== 'active') {
            notify('모델이 선택되지 않았거나 로드되지 않았습니다.', 'info')
            return
        }

        if (!deviceId) {
            notify('사용할 마이크를 선택해 주세요!', 'info')
            return
        }

        if (isConnected || isRecording) {
            notify('이미 녹음 중입니다.', 'error')
            return
        }

        const newSocket = io('http://localhost:8000', {
            path: "/socket.io",
            transports: ['websocket'],
            autoConnect: false,
            withCredentials: true,
        })

        newSocket.connect()

        newSocket.on('recognizing', (data: { text: string }) => {
            setTranscript(data.text)
        })

        newSocket.on('recognized', async (data: { text: string}) => {
            finalizeTranscript()

            try {
                await axios.post('http://localhost:8000/asr/save/result', {
                    model: selectedModel?.name ?? 'UnknownModel',
                    text: data.text,
                    language: 'ko',
                })
            } catch (error) {
                console.error('[DB] 저장 실패: ', error)
            }
        })

        newSocket.on('connect', async () => {
            // console.log('[SOCKET] 연결 성공')
            setIsConnected(true)
            notify('Socket과 연결되었습니다.', 'success')

            if (selectedModel.framework === 'Azure') {
                const payload: any = {
                    model_id: selectedModel.id,
                }

                if (deviceId && deviceId !== 'default') {
                    payload.deviceLabel = deviceName
                }

                newSocket.emit('start_azure_mic', payload)
                console.log('🔵 start_azure_mic payload:', payload)
            } else {
                newSocket.emit('start_transcribe', { model_id: selectedModel.id });
            }
            setRecording(true)
        })

        newSocket.on('disconnect', () => {
            // console.log('[SOCKET] 연결 종료')
            setIsConnected(false)
            setRecording(false)
            notify('Socket과 연결을 종료했습니다.', 'success')
        })

        newSocket.on('error', (err) => {
            // console.error('[SOCKET] 오류 발생: ', err)
            notify('Socket과 연결 중 오류가 발생했습니다.', 'error')
        })

        setSocket(newSocket)
    }

    const handleStop = () => {
        if (!selectedModel || selectedModel.status !== 'active') {
            notify('모델이 선택되지 않았거나 종료된 상태입니다.', 'info')
            return
        }
        if (!isRecording) {
            notify('현재 녹음 중이 아닙니다.', 'info')
            return
        }
        if (socket) {
            if (selectedModel.framework === 'Azure') {
                socket.emit('stop_azure_mic', {});
            } else {
                socket.emit('stop_transcribe', {});
            }
            setIsConnected(false);
            setRecording(false);

            socket.disconnect()

            setSocket(null)
        }
        notify('Socket과 연결을 종료했습니다.', 'success')
    }

    const handleReset = () => {
        notify('전사된 텍스트를 초기화했습니다.', 'info')
        clearTranscript()
    }

    useEffect(() => {
        return () => {
            if (socket && socket.connected) {
                socket.disconnect()
            }
        }
    }, [])

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
                    <div className='text-[16px] font-medium text-neutral-600'>
                        {currentTranscript ? currentTranscript.text : (isConnected ? '✅ 실시간 텍스트 수신 중...' : '🟡 연결되지 않음. 시작을 눌러주세요.')}
                    </div>
                </div>

                <div className='text-sm text-neutral-500'>
                    <div className='mb-1'>인식 로그</div>
                    {history.length === 0 ? (
                        <div className='px-3 py-1 text-gray-400'>
                            로그가 없습니다. 새로운 로그를 기다려보세요.
                        </div>
                    ) : (
                        <ul className='space-y-1 pl-3 list-disc'>
                            {history.slice(-1).map((item, index) => (
                                <li key={index}>
                                    '{item.text}' ({item.lang}) - {item.timestamp}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
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