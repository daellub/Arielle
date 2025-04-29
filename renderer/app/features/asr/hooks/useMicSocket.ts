// app/hooks/useMicSocket.ts
'use client'

import { useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'

import { useSelectedModelStore } from '@/app/features/asr/store/useSelectedModelStore'

interface MicOptions {
    socket: Socket
    deviceId?: string
    sampleRate: number
    volumeGain: number
    noiseSuppression: boolean
    echoCancellation: boolean
    useVAD: boolean
    silenceTimeout: number
}

export const useMicSocket = ({
    socket,
    deviceId,
    sampleRate,
    volumeGain,
    noiseSuppression,
    echoCancellation,
    useVAD,
    silenceTimeout
}: MicOptions) => {
    useEffect(() => {
        let audioContext: AudioContext | null = null
        let source: MediaStreamAudioSourceNode | null = null
        let processor: AudioWorkletNode | null = null 
        
        const init = async () => {
            audioContext = new AudioContext()

            await audioContext.audioWorklet.addModule('/processor.js')

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId } : true,
            })

            source = audioContext.createMediaStreamSource(stream)
            processor = new AudioWorkletNode(audioContext, 'audio-processor')

            processor.port.onmessage = (event) => {
                const float32Array = new Float32Array(event.data)
                socket.emit('audio_chunk', Array.from(float32Array))
            }
        }

        init()
        return () => {
            processor?.disconnect()
            source?.disconnect()
            audioContext?.close()
        }
    }, [socket, deviceId])
}
