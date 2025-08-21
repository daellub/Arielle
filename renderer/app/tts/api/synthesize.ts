// app/tts/api/synthesize.ts
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

const ttsApi = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
})

/**
 * 합성된 오디오 Blob의 URL을 반환하는 방식
 * URL.revokeObjectURL(url)
 */

export async function synthesizeTTS(text: string): Promise<string> {
    if (!text?.trim()) throw new Error('합성할 텍스트가 비어있습니다.')
    
    try {
        const res = await ttsApi.post('/tts/synthesize',
            {
                text,
                model_id: 0,
                speaker_id: 0,
                style: "Neutral",
                language: "JP",
            },
            {
                responseType: 'blob'
            }
        )

        const contentType = String(res.headers['content-type'] || '').toLowerCase()
        const blob: Blob = res.data

        if (contentType.includes('application/json')) {
            const txt = await blob.text()
            try {
                const json = JSON.parse(txt)
                throw new Error(json?.message || 'TTS 요청 실패')
            } catch (error) {
                throw new Error(text || 'TTS 요청 실패')
            }
        }

        return URL.createObjectURL(blob)
    } catch (err: any) {
        const msg =
            err?.response?.data?.message ||
            err?.message ||
            'TTS 요청 중 오류가 발생했습니다.'
        throw new Error(msg)
    }
}

import type { AxiosProgressEvent } from 'axios'

export type TTSOptions = {
    modelId?: number
    speakerId?: number
    style?: string
    language?: 'JP' | 'EN' | 'KO' | string
    timeoutMs?: number
    signal?: AbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
}

export async function synthesizeTTSEx(
    text: string,
    {
        modelId = 0,
        speakerId = 0,
        style = "Neutral",
        language = "JP",
        timeoutMs = 15000,
        signal,
        onDownloadProgress
    }: TTSOptions = {}
): Promise<{ url: string; blob: Blob; revoke: () => void }> {
    if (!text?.trim()) throw new Error('합성할 텍스트가 비어있습니다.')

    const res = await ttsApi.post(
        '/tts/synthesize',
        { text, model_id: modelId, speaker_id: speakerId, style, language },
        { responseType: 'blob', timeout: timeoutMs, signal, onDownloadProgress }
    )

    const ct = String(res.headers['content-type'] || '').toLowerCase()
    const blob: Blob = res.data

    if (ct.includes('application/json')) {
        const txt = await blob.text()
        try {
            const j = JSON.parse(txt)
            throw new Error(j?.message || 'TTS 요청 실패')
        } catch {
            throw new Error(txt || 'TTS 요청 실패')
        }
    }

    const url = URL.createObjectURL(blob)
    const revoke = () => URL.revokeObjectURL(url)
    return { url, blob, revoke }
}
