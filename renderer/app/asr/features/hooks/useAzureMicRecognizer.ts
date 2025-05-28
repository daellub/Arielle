// app/asr/features/hooks/useAzureMicRecognizer.ts
import { recognizeAzureSpeech } from './useAzureSTT'

interface AzureMicRecognizerOptions {
    deviceId?: string
    sampleRate: number
    onText: (text: string) => void
    apiKey: string
    region?: string
    endpoint?: string
    language?: string
}

export async function initAzureMicRecognizer({
    deviceId,
    sampleRate,
    onText,
    apiKey,
    region,
    endpoint,
    language = 'ko-KR',
}: AzureMicRecognizerOptions) {
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

    let inProgress = false

    processor.port.onmessage = async (event) => {
        if (inProgress) return

        const chunk = new Float32Array(event.data)
        const rms = Math.sqrt(chunk.reduce((sum, v) => sum + v * v, 0) / chunk.length)

        if (rms > RMS_THRESHOLD) {
            audioBuffer.push(...chunk)
            silenceFrames = 0
        } else {
            silenceFrames++
        }

        const totalBufferMs = (audioBuffer.length / sampleRate) * 1000

        if (silenceFrames > 3 && totalBufferMs >= MIN_BUFFER_MS) {
            const buffer = new Float32Array(audioBuffer)
            const wavBlob = float32ToWavBlob(buffer, sampleRate)
            audioBuffer = []

            try {
                inProgress = true
                const text = await recognizeAzureSpeech(wavBlob, apiKey, region, endpoint, language)
                if (text) onText(text)
            } catch (err) {
                console.error('Azure STT 오류:', err)
            } finally {
                inProgress = false
            }
        }
    }

    source.connect(processor)
    processor.connect(audioContext.destination)

    return {
        stop: () => {
            processor.disconnect()
            source.disconnect()
            stream.getTracks().forEach((t) => t.stop())
            audioContext.close()
        }
    }
}

function float32ToWavBlob(buffer: Float32Array, sampleRate: number): Blob {
    const wavBuffer = encodeWAV(buffer, sampleRate)
    return new Blob([wavBuffer], { type: 'audio/wav' })
}

function encodeWAV(buffer: Float32Array, sampleRate: number): ArrayBuffer {
    const bufferLength = buffer.length * 2
    const view = new DataView(new ArrayBuffer(44 + bufferLength))

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i))
        }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + bufferLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, bufferLength, true)

    let offset = 44
    for (let i = 0; i < buffer.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, buffer[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }

    return view.buffer
}