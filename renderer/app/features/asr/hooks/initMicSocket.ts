// app/features/asr/hooks/initMicSocket.ts

import { Socket } from 'socket.io-client'

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

export const initMicSocket = async ({
    socket,
    deviceId,
    sampleRate,
    volumeGain
}: MicOptions) => {
    const audioContext = new AudioContext()
    await audioContext.audioWorklet.addModule('/processor.js')

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    })

    const source = audioContext.createMediaStreamSource(stream)
    const processor = new AudioWorkletNode(audioContext, 'audio-processor')

    let audioBuffer: number[] = []
    let silenceFrames = 0
    const RMS_THRESHOLD = 0.01
    const MIN_BUFFER_MS = 100

    processor.port.onmessage = (event) => {
        const chunk = new Float32Array(event.data)
        const rms = Math.sqrt(chunk.reduce((sum, v) => sum + v * v, 0) / chunk.length)

        if (rms > RMS_THRESHOLD) {
            audioBuffer.push(...chunk)
            silenceFrames = 0
        } else {
            silenceFrames += 1
        }

        const chunkDurationMs = (chunk.length / sampleRate) * 1000
        const totalBufferMs = (audioBuffer.length / sampleRate) * 1000

        if (silenceFrames > 3 && totalBufferMs >= MIN_BUFFER_MS) {
            socket.emit('audio_chunk', audioBuffer)
            audioBuffer = []
        }
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    return {
        stop: () => {
            processor.disconnect()
            source.disconnect()
            audioContext.close()
        }
    }
}
