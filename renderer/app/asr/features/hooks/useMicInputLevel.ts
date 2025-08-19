// app/asr/features/hooks/useMicInputLevel.ts
'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 마이크 입력 레벨을 가져오는 커스텀 훅입니다.
 * @param deviceId 입력 장치 ID
 * @returns 현재 입력 레벨 (0-100 범위)
 */

export const useMicInputLevel = (deviceId?: string) => {
    const [level, setLevel] = useState(0)

    const audioCtxRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const gainRef = useRef<GainNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        if (!deviceId) {
            setLevel(0)

            // 리소스 정리
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            if (sourceRef.current) sourceRef.current.disconnect()
            if (gainRef.current) gainRef.current.disconnect()
            if (analyserRef.current) analyserRef.current.disconnect()
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
            }
            if (audioCtxRef.current) {
                try {
                    audioCtxRef.current.close()
                } catch {}
            }
            audioCtxRef.current = null
            analyserRef.current = null
            gainRef.current = null
            sourceRef.current = null
            streamRef.current = null
            rafRef.current = null
            return
        }

        let stopped = false

        const init = async () => {
            try {
                const ctx = new AudioContext({ latencyHint: 'interactive' })
                audioCtxRef.current = ctx

                const constraints: MediaStreamConstraints = {
                    audio: {
                        deviceId: { exact: deviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: false,
                    },
                    video: false,
                }

                const stream = await navigator.mediaDevices.getUserMedia(constraints)
                if (stopped) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }
                streamRef.current = stream

                const source = ctx.createMediaStreamSource(stream)
                sourceRef.current = source

                const gain = ctx.createGain()
                gain.gain.value = 1.0
                gainRef.current = gain

                const analyser = ctx.createAnalyser()
                analyser.fftSize = 1024
                analyser.smoothingTimeConstant = 0.85
                analyserRef.current = analyser

                source.connect(gain)
                gain.connect(analyser)

                const data = new Uint8Array(analyser.fftSize)

                const loop = () => {
                    if (!analyserRef.current) return
                    analyserRef.current.getByteTimeDomainData(data)

                    let sumSq = 0
                    for (let i = 0; i < data.length; i++) {
                        const v = (data[i] - 128) / 128 // -1 ~ 1
                        sumSq += v * v
                    }
                    const rms = Math.sqrt(sumSq / data.length) // 0~1
                    const pct = Math.min(100, Math.max(0, Math.round(rms * 140)))

                    setLevel(pct)
                    rafRef.current = requestAnimationFrame(loop)
                }

                rafRef.current = requestAnimationFrame(loop)
            } catch (e) {
                console.warn('[useMicInputLevel] getUserMedia 실패: ', e)
                setLevel(0)
            }
        }

        init()

        return () => {
            stopped = true
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            if (sourceRef.current) sourceRef.current.disconnect()
            if (gainRef.current) gainRef.current.disconnect()
            if (analyserRef.current) analyserRef.current.disconnect()
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
            }
            if (audioCtxRef.current) {
                try {
                    audioCtxRef.current.close()
                } catch {}
            }
            audioCtxRef.current = null
            analyserRef.current = null
            gainRef.current = null
            sourceRef.current = null
            streamRef.current = null
            rafRef.current = null
        }
    }, [deviceId])

    return level
}