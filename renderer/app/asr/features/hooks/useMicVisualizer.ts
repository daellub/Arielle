// app/asr/features/hooks/useMicVisualizer.ts
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface UseMicVisualizerOpts {
    deviceId?: string
    enabled: boolean
    noiseSuppression?: boolean
    echoCancellation?: boolean
    autoGainControl?: boolean
}

export function useMicVisualizer({
    deviceId,
    enabled,
    noiseSuppression = false,
    echoCancellation = false,
    autoGainControl = false,
}: UseMicVisualizerOpts) {
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
    const [monitoring, setMonitoring] = useState(false)
    const [monitorGain, setMonitorGain] = useState(0.3)

    const ctxRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const gainRef = useRef<GainNode | null>(null)
    const connectedRef = useRef(false)

    useEffect(() => {
        if (!enabled) {
            if (connectedRef.current && gainRef.current) {
                try { gainRef.current.disconnect() } catch {}
            }
            connectedRef.current = false

            if (ctxRef.current) { try { ctxRef.current.close() } catch {} }
            ctxRef.current = null

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
            }
            streamRef.current = null

            sourceRef.current = null
            analyserRef.current = null
            gainRef.current = null
            setAnalyser(null)
            setMonitoring(false)
            return
        }

        let cancelled = false
        ;(async () => {
            try {
                try { await navigator.mediaDevices.getUserMedia({ audio: true }) } catch {}

                const constraints: MediaStreamConstraints = {
                    audio: {
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                        echoCancellation,
                        noiseSuppression,
                        autoGainControl,
                    } as MediaTrackConstraints,
                    video: false,
                }

                const stream = await navigator.mediaDevices.getUserMedia(constraints)
                if (cancelled) {
                    stream.getTracks().forEach(t => t.stop())
                    return
                }

                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                const source = ctx.createMediaStreamSource(stream)
                const an = ctx.createAnalyser()
                an.fftSize = 2048
                an.smoothingTimeConstant = 0.85

                const gain = ctx.createGain()
                gain.gain.value = monitorGain

                source.connect(an)

                ctxRef.current = ctx
                streamRef.current = stream
                sourceRef.current = source
                analyserRef.current = an
                gainRef.current = gain
                setAnalyser(an)
            } catch (e) {
                console.error('useMicVisualizer init error:', e)
                setAnalyser(null)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [enabled, deviceId, echoCancellation, noiseSuppression, autoGainControl])

    useEffect(() => {
        const ctx = ctxRef.current
        const gain = gainRef.current
        const src = sourceRef.current
        if (!ctx || !gain || !src) return

        gain.gain.value = monitorGain

        if (monitoring && !connectedRef.current) {
            try {
                src.connect(gain)
                gain.connect(ctx.destination)
                connectedRef.current = true
            } catch (e) {
                console.error('monitor connect error:', e)
            }
        } else if (!monitoring && connectedRef.current) {
            try {
                gain.disconnect()
            } catch {}
            connectedRef.current = false
        }
    }, [monitoring, monitorGain])

    const sampleRate = useMemo(() => ctxRef.current?.sampleRate ?? null, [analyser])

    return {
        analyser,
        monitoring,
        setMonitoring,
        monitorGain,
        setMonitorGain,
        sampleRate,
    }
}
