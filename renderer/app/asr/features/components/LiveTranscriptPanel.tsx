// app/asr/features/components/LiveTranscriptPanel.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import debounce from 'lodash.debounce'
import axios from 'axios'
import { shallow } from 'zustand/shallow'

import { useRecordingStore } from '@/app/store/useRecordingStore'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { initAzureMicRecognizer } from '@/app/asr/features/hooks/useAzureMicRecognizer'
import { useTranscriptStore } from '@/app/asr/features/store/useTranscriptStore'
import { useSelectedModelStore } from '@/app/asr/features/store/useSelectedModelStore'
import { useModelsStore } from '@/app/asr/features/store/useModelsStore'
import type { ModelsState } from '@/app/asr/features/store/useModelsStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import type { Model } from '@/app/asr/features/types/Model'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

type AzureRecognizer = { stop: () => void }

export default function LiveTranscriptPanel() { 
    const { 
        setTranscript,
        finalizeTranscript,
        clearTranscript,
        currentTranscript,
        history
    } = useTranscriptStore()
    const { deviceId } = useMicStore(
        (s) => ({ deviceId: s.deviceId }),
        shallow
    )

    const { selectedModelId } = useSelectedModelStore()
    const { byId } = useModelsStore((s: ModelsState) => ({ byId: s.byId }), shallow)

    const notify = useNotificationStore((s) => s.show)
    const isRecording = useRecordingStore((s) => s.isRecording)
    const setRecording = useRecordingStore((s) => s.setRecording)

    const [isConnected, setIsConnected] = useState(false)
    const modeRef = useRef<'azure' | 'socket' | null>(null)
    const socketRef = useRef<Socket | null>(null)
    const recognizerRef = useRef<AzureRecognizer | null>(null)

    const selectedModelRef = useRef<Model | null>(null)

    const debouncedSetTranscript = useMemo(
        () =>
            debounce((text: string) => {
                setTranscript(text)
            }, 250),
        [setTranscript]
    )

    const http = useMemo(
        () =>
            axios.create({
                baseURL: BASE_URL,
                withCredentials: true,
                timeout: 10000,
            }),
        [BASE_URL]
    )

    const displayedText = useMemo(() => {
        if (currentTranscript) return currentTranscript.text
        return isConnected ? '✅ 실시간 텍스트 수신 중...' : '🟡 연결되지 않음. 시작을 눌러주세요.'
    }, [currentTranscript, isConnected])

    const ensureModel = useCallback(async (): Promise<Model> => {
        if (!selectedModelId) throw new Error('no-selected-id')

        const fromStore = byId?.[selectedModelId]
        if (fromStore) {
            selectedModelRef.current = fromStore
            return fromStore
        }
        try {
            const { data } = await http.get<Model>(`/asr/models/${selectedModelId}`)
            selectedModelRef.current = data
            return data
        } catch {
            const { data } = await http.get<Model[]>(`/asr/models`)
            const found = data.find((m) => m.id === selectedModelId)
            if (!found) throw new Error('resolve-failed')
            selectedModelRef.current = found
            return found
        }
    }, [byId, http, selectedModelId])

    const guardStart = useCallback(async (): Promise<string | null> => {
        try {
            const model = await ensureModel()
            if (model.status !== 'active') return '모델이 로드되지 않았습니다.'
        } catch {
            return '모델 정보를 불러올 수 없습니다.'
        }
        if (!deviceId) return '사용할 마이크를 선택해 주세요!'
        if (isConnected || isRecording) return '이미 녹음 중입니다.'
        return null
    }, [deviceId, isConnected, isRecording, ensureModel])


    // Azure 모드
    const startAzure = useCallback(async () => {
        const model = selectedModelRef.current!
        try {
            const res = await axios.get(`${BASE_URL}/asr/models/${model.id}/credentials`)
            const creds = res.data as { apiKey: string; region?: string; endpoint?: string; language?: string }

            const instance = await initAzureMicRecognizer({
                deviceId,
                sampleRate: 16000,
                apiKey: creds.apiKey,
                region: creds.region,
                endpoint: creds.endpoint,
                language: creds.language ?? 'ko-KR',
                onText: async (text) => {
                    setTranscript(text)
                    finalizeTranscript()
                    try {
                        await http.post(`/asr/save/result`, {
                            model: model.name ?? 'UnknownModel',
                            text,
                            language: creds.language ?? 'ko-KR',
                        })
                    } catch (err) {
                    console.error('[DB 저장 실패]', err)
                    }
                },
            })

            recognizerRef.current = instance
            modeRef.current = 'azure'
            setIsConnected(true)
            setRecording(true)
            notify('Azure 인식 시작됨 🎙', 'success')
        } catch (err) {
            console.error('[Azure Init Error]', err)
            notify('Azure STT 시작 실패', 'error')
        }
    }, [BASE_URL, deviceId, finalizeTranscript, notify, setRecording, setTranscript])

    // Socket 모드
    const startSocket = useCallback(() => {
        const model = selectedModelRef.current!
        const s: Socket = io(BASE_URL, {
            path: '/socket.io',
            transports: ['websocket'],
            autoConnect: false,
            withCredentials: true,
        })

        socketRef.current = s
        modeRef.current = 'socket'
        s.connect()

        const onRecognizing = (data: { text: string }) => debouncedSetTranscript(data.text)
        const onRecognized = async (data: { text: string }) => {
            finalizeTranscript()
                try {
                    await axios.post(`${BASE_URL}/asr/save/result`, {
                    model: model.name ?? 'UnknownModel',
                    text: data.text,
                    language: 'ko',
                    })
                } catch (error) {
                    console.error('[DB] 저장 실패: ', error)
                }
        }
        const onConnect = () => {
            setIsConnected(true)
            setRecording(true)
            notify('Socket과 연결되었습니다.', 'success')
            s.emit('start_transcribe', { model_id: model.id })
        }
        const onDisconnect = () => {
            setIsConnected(false)
            setRecording(false)
            notify('Socket과 연결을 종료했습니다.', 'success')
        }
        const onError = (err: any) => {
            console.error('[SOCKET] 오류:', err)
            notify('Socket과 연결 중 오류가 발생했습니다.', 'error')
        }

        s.on('recognizing', onRecognizing)
        s.on('recognized', onRecognized)
        s.on('connect', onConnect)
        s.on('disconnect', onDisconnect)
        s.on('error', onError)

        const cleanup = () => {
            s.off('recognizing', onRecognizing)
            s.off('recognized', onRecognized)
            s.off('connect', onConnect)
            s.off('disconnect', onDisconnect)
            s.off('error', onError)
        }

        ;(s as any).__cleanup = cleanup
    }, [BASE_URL, debouncedSetTranscript, finalizeTranscript, notify, setRecording])

    const handleStart = useCallback(async () => {
        const why = await guardStart()
        if (why) return notify(why, 'info')

        const model = selectedModelRef.current!
        if (model.framework === 'Azure') {
            await startAzure()
        } else {
            startSocket()
        }
    }, [guardStart, notify, startAzure, startSocket])

    const handleStop = useCallback(async () => {
        if (!isConnected && !isRecording) {
            notify('현재 녹음 중이 아닙니다.', 'info')
        }

        if (modeRef.current === 'azure') {
            try { recognizerRef.current?.stop?.() } catch  {}
            recognizerRef.current = null
            modeRef.current = null
            setIsConnected(false)
            setRecording(false)
            return notify('녹음이 중지되었습니다.', 'success')
        } 

        const s = socketRef.current
        try {
            if (s?.connected) {
                s.emit('stop_transcribe', {})
            }

            ;(s as any)?.__cleanup?.()
            s?.disconnect()
        } catch {}
        socketRef.current = null
        modeRef.current = null
        setIsConnected(false)
        setRecording(false)
        notify('Socket 연결 종료됨', 'success')
    }, [isConnected, isRecording, notify, setRecording])

    const handleReset = useCallback(() => {
        clearTranscript()
        notify('전사된 텍스트를 초기화했습니다.', 'info')
    }, [clearTranscript, notify])   

    useEffect(() => {
        return () => {
            try { debouncedSetTranscript.cancel() } catch {}
            try { recognizerRef.current?.stop?.() } catch {}
            try {
                const s = socketRef.current
                ;(s as any)?.__cleanup?.()
                s?.disconnect()
            } catch {}
        }
    }, [debouncedSetTranscript])

    return (
        <>
            <div className="w-[600px] h-[250px] px-6 py-6 
                bg-white/50 backdrop-blur-md border border-white/10 
                shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-2xl transition-all"
            >
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
                        {displayedText}
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
                                <li key={`${item.timestamp}-${index}`}>
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