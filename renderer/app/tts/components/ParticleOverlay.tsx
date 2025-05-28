// app/tts/components/ParticleOverlay.tsx
'use client'

import { useEffect, useRef } from 'react'

export default function ParticleOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')!
        let particles: any[] = []
        const w = canvas.width = window.innerWidth
        const h = canvas.height = window.innerHeight

        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.5 + 0.5,
                dx: (Math.random() - 0.5) * 0.4,
                dy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.2
            })
        }

        const draw = () => {
            ctx.clearRect(0, 0, w, h)
            particles.forEach((p) => {
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(202, 170, 255, ${p.alpha})`
                ctx.fill()

                p.x += p.dx
                p.y += p.dy

                if (p.x < 0 || p.x > w) p.dx *= -1
                if (p.y < 0 || p.y > h) p.dy *= -1
            })
            requestAnimationFrame(draw)
        }

        draw()
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none opacity-10 mix-blend-screen"
        />
    )
}
