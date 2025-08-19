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
    const audioContext = new AudioContext({ sampleRate, latencyHint: 'interactive' })
    await audioContext.audioWorklet.addModule('/processor.js')

    const constraints: MediaStreamConstraints = {
        audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: false,
                }
            : true,
        video: false,
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    const source = audioContext.createMediaStreamSource(stream)
    const processor = new AudioWorkletNode(audioContext, 'audio-processor')

    const sink = audioContext.createGain()
    sink.gain.value = 0
    processor.connect(sink)
    sink.connect(audioContext.destination)

    source.connect(processor)

    // VAD / 버퍼링 파라미터
    const ctxRate = audioContext.sampleRate
    const RMS_THRESHOLD = 0.01         // 음성 감지 기준
    const SILENCE_FRAMES = 8           // 침묵 N 프레임 후 컷
    const MIN_BUFFER_MS = 200          // 최소 구간 (짧은 숨소리 등 컷 방지)
    const MAX_BUFFER_MS = 10_000       // 10초 제한 (안전장치)

    let audioBuffer: Float32Array[] = []
    let framesSilence = 0
    let inFlight = false

    const flushSegment = async () => {
        const totalLen = audioBuffer.reduce((a, b) => a + b.length, 0)
        if (totalLen === 0) return
        const merged = new Float32Array(totalLen)
        let off = 0
        for (const c of audioBuffer) {
            merged.set(c, off)
            off += c.length
        }
        audioBuffer = []

        const wavBlob = float32ToWavBlob(merged, ctxRate)

        try {
            inFlight = true
            const text = await recognizeAzureSpeech(wavBlob, apiKey, region, endpoint, language)
            if (text) onText(text)
        } catch (err) {
            console.error('Azure STT 오류:', err)
        } finally {
            inFlight = false
        }
    }

    processor.port.onmessage = async (event) => {
        if (!event?.data) return
        const chunk = event.data instanceof Float32Array ? event.data : new Float32Array(event.data)

        let sumSq = 0
        for (let i = 0; i < chunk.length; i++) {
            const v = chunk[i]
            sumSq += v * v
        }
        const rms = Math.sqrt(sumSq / chunk.length)

        const totalSamples = audioBuffer.reduce((a, b) => a + b.length, 0) + chunk.length
        const totalMs = (totalSamples / ctxRate) * 1000

        if (rms > RMS_THRESHOLD) {
            audioBuffer.push(chunk)
            framesSilence = 0
            if (!inFlight && totalMs >= MAX_BUFFER_MS) {
                await flushSegment()
            }
        } else {
            framesSilence++
            if (!inFlight && framesSilence >= SILENCE_FRAMES && totalMs >= MIN_BUFFER_MS) {
                await flushSegment()
            }
        }
    }

    return {
        stop: () => {
            try {
                processor.disconnect()
                sink.disconnect()
                source.disconnect()
            } catch {}
            stream.getTracks().forEach((t) => t.stop())
            audioContext.close()
        },
    }
}

function float32ToWavBlob(buffer: Float32Array, sampleRate: number): Blob {
    const wavBuffer = encodeWAV(buffer, sampleRate)
    return new Blob([wavBuffer], { type: 'audio/wav' })
}

function encodeWAV(buffer: Float32Array, sampleRate: number): ArrayBuffer {
    const bytesPerSample = 2
    const blockAlign = 1 * bytesPerSample // mono
    const byteRate = sampleRate * blockAlign
    const dataSize = buffer.length * bytesPerSample

    const view = new DataView(new ArrayBuffer(44 + dataSize))
    let offset = 0

    writeStr(view, offset, 'RIFF'); offset += 4
    view.setUint32(offset, 36 + dataSize, true); offset += 4
    writeStr(view, offset, 'WAVE'); offset += 4
    writeStr(view, offset, 'fmt '); offset += 4
    view.setUint32(offset, 16, true); offset += 4       // Subchunk1Size (PCM)
    view.setUint16(offset, 1, true); offset += 2        // AudioFormat (PCM)
    view.setUint16(offset, 1, true); offset += 2        // NumChannels (mono)
    view.setUint32(offset, sampleRate, true); offset += 4
    view.setUint32(offset, byteRate, true); offset += 4
    view.setUint16(offset, blockAlign, true); offset += 2
    view.setUint16(offset, 16, true); offset += 2       // BitsPerSample
    writeStr(view, offset, 'data'); offset += 4
    view.setUint32(offset, dataSize, true); offset += 4

    for (let i = 0; i < buffer.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, buffer[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return view.buffer
}

function writeStr(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}