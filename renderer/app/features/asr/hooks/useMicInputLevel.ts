// app/features/asr/hooks/useMicInputLevel.ts
'use client'

import { useEffect, useRef, useState } from 'react'

export const useMicInputLevel = (deviceId?: string) => {
    const [level, setLevel] = useState(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let animationId: number

    useEffect(() => {
        const init = async () => {
            if (!audioContextRef.current) audioContextRef.current = new AudioContext({ latencyHint: "interactive" })

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId } : true,
            })

            analyser = audioContextRef.current.createAnalyser()
            analyser.smoothingTimeConstant = 0.85
            source = audioContextRef.current.createMediaStreamSource(stream)
            source.connect(analyser)
            const data = new Uint8Array(analyser.frequencyBinCount)

            const update = () => {
                if (!analyser) return
                analyser.getByteFrequencyData(data)
                const volume = data.reduce((a, b) => a + b, 0) / data.length
                setLevel(Math.min(100, Math.round(volume)))
                animationId = requestAnimationFrame(update)
            }

            update()
        }

        init()

        return () => {
            cancelAnimationFrame(animationId)
            source?.disconnect()
            audioContextRef.current?.close()
            audioContextRef.current = null
        }
    }, [deviceId])

    return level
}