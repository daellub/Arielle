// app/dashboard/components/PipelineGlyph.tsx
'use client'

import React from 'react'

export default function PipelineGlyph({ className }: { className?: string }) {
    return (
        <div className="dash-centerGlyph" aria-hidden>
            <svg width="720" height="720" viewBox="0 0 720 720" fill="none">
                <g opacity="0.18" filter="url(#glow)">
                    <circle cx="360" cy="360" r="300" stroke="url(#grad1)" strokeWidth="1.2"/>
                    <circle cx="360" cy="360" r="230" stroke="url(#grad2)" strokeWidth="1"/>
                    <circle cx="360" cy="360" r="160" stroke="url(#grad3)" strokeWidth="0.8"/>

                    {[
                        { x: 360, y: 60,  label: 'ASR' },
                        { x: 640, y: 240, label: '번역' },
                        { x: 560, y: 520, label: 'LLM' },
                        { x: 160, y: 520, label: 'TTS' },
                        { x: 80,  y: 240, label: 'VRM' },
                    ].map((n, i) => (
                        <g key={i}>
                            <circle cx={n.x} cy={n.y} r="3.2" fill="white" opacity="0.6"/>
                            <text x={n.x} y={n.y - 10} textAnchor="middle" fontSize="10" fill="white" opacity="0.35">
                                {n.label}
                            </text>
                        </g>
                    ))}

                    <path d="M360 60 L640 240 L560 520 L160 520 L80 240 Z"
                        stroke="url(#gradLine)" strokeWidth="1" fill="none" className="dash-glyphStroke"/>
                    <path d="M360 60 L360 360 M640 240 L360 360 M560 520 L360 360 M160 520 L360 360 M80 240 L360 360"
                        stroke="url(#gradLine)" strokeWidth="0.7" opacity="0.6" />

                    <g opacity="0.35">
                        {Array.from({ length: 12 }).map((_, i) => {
                            const a = (i * Math.PI * 2) / 12
                            const x = 360 + Math.cos(a) * 300
                            const y = 360 + Math.sin(a) * 300
                            return <line key={i} x1="360" y1="360" x2={x} y2={y} stroke="url(#grad3)" strokeWidth="0.6" />
                        })}
                    </g>
                </g>

                <defs>
                    <linearGradient id="grad1" x1="60" y1="60" x2="660" y2="660">
                        <stop offset="0%" stopColor="#9ac5fc" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#d3c3fc" stopOpacity="0.35"/>
                    </linearGradient>
                    <linearGradient id="grad2" x1="100" y1="100" x2="620" y2="620">
                        <stop offset="0%" stopColor="#b8ccff" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#e2d9ff" stopOpacity="0.25"/>
                    </linearGradient>
                    <linearGradient id="grad3" x1="140" y1="140" x2="580" y2="580">
                        <stop offset="0%" stopColor="#bcd0ff" stopOpacity="0.18"/>
                        <stop offset="100%" stopColor="#e6e1ff" stopOpacity="0.18"/>
                    </linearGradient>
                    <linearGradient id="gradLine" x1="80" y1="60" x2="640" y2="520">
                        <stop offset="0%" stopColor="#b9c5ff" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#f0e1ff" stopOpacity="0.35"/>
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feBlend in="SourceGraphic" in2="blur" mode="screen"/>
                    </filter>
                </defs>
            </svg>
        </div>
    )
}
