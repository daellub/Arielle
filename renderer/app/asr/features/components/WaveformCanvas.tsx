// app/asr/features/components/WaveformCanvas.tsx
'use client'

import React, { useEffect, useRef } from 'react'

interface Props {
    analyser: AnalyserNode | null
    width?: number
    height?: number
    rounded?: boolean
    fps?: number
    sampleStep?: number
    vpad?: number
    lineWidth?: number
}

export default function WaveformCanvas({
    analyser,
    width = 260,
    height = 60,
    rounded = true,
    fps = 24,
    sampleStep = 3,
    vpad = 2,
    lineWidth = 2,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const lastTsRef = useRef(0)
    const bufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(width * dpr)
        canvas.height = Math.floor(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
    }, [width, height])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !analyser) return

        const dpr = window.devicePixelRatio || 1
        const ctx = canvas.getContext('2d')!
        const allocBuffer = () =>
            (bufferRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize)) as Uint8Array<ArrayBuffer>)

        if (!bufferRef.current || bufferRef.current.length !== analyser.fftSize) allocBuffer()

        const frameInterval = 1000 / Math.max(1, fps)

        const draw = (ts: number) => {
            rafRef.current = requestAnimationFrame(draw)

            if (ts - lastTsRef.current < frameInterval) return
            lastTsRef.current = ts

            if (!bufferRef.current || bufferRef.current.length !== analyser.fftSize) allocBuffer()
            const buf = bufferRef.current!

            analyser.getByteTimeDomainData(buf)

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = 'rgba(0,0,0,0.55)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.lineWidth = 1 * dpr
            ctx.beginPath()
            ctx.moveTo(0, canvas.height / 2)
            ctx.lineTo(canvas.width, canvas.height / 2)
            ctx.stroke()

            const innerH = Math.max(0, canvas.height - 2 * vpad * dpr)
            const total = buf.length
            const points = Math.max(2, Math.ceil(total / Math.max(1, sampleStep)))
            const slice = canvas.width / (points - 1)

            ctx.lineWidth = lineWidth * dpr
            ctx.strokeStyle = 'white'
            ctx.beginPath()

            let x = 0
            let smoothY = canvas.height / 2
            const alpha = 0.2

            for (let i = 0; i < total; i += Math.max(1, sampleStep)) {
                const v = buf[i] / 128.0 // 0~2
                const yRaw = vpad * dpr + (v * innerH) / 2
                smoothY = smoothY * (1 - alpha) + yRaw * alpha

                if (i === 0) ctx.moveTo(x, smoothY)
                else ctx.lineTo(x, smoothY)
                x += slice
            }
            ctx.stroke()
        }

        rafRef.current = requestAnimationFrame(draw)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [analyser, fps, sampleStep, vpad, lineWidth])

    return (
        <canvas
            ref={canvasRef}
            className={rounded ? 'rounded-md overflow-hidden' : undefined}
            aria-label="마이크 파형 미리보기"
        />
    )
}
