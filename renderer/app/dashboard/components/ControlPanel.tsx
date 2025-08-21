// app/dashboard/components/ControlPanel.tsx
'use client'

import { RotateCcw, Wand2, ListRestart } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const presets = ['Balanced', 'Creative', 'Precise'] as const
type Preset = typeof presets[number]

export default function ControlPanel() {
    const [preset, setPreset] = useState<Preset>('Balanced')

    return (
        <div className="inline-flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
                {presets.map(p => (
                    <button
                        key={p}
                        onClick={() => setPreset(p)}
                        className={clsx('px-3 py-1 rounded-md text-xs border transition',
                            preset === p
                                ? 'bg-white text-[#1d2a55] border-white'
                                : 'bg-white/0 text-white/80 border-white/25 hover:bg-white/10')}
                        title="프리셋 전환"
                    >
                        <Wand2 className="inline w-3.5 h-3.5 mr-1" />
                        {p}
                    </button>
                ))}
            </div>

            <button
                onClick={() => {/* TODO: 파이프라인 리셋 */}}
                className="px-3 py-1 rounded-md text-xs bg-white/10 text-white/90 border border-white/20 hover:bg-white/20"
                title="파이프라인 재시작"
            >
                <ListRestart className="inline w-4 h-4 mr-1" />
                재시작
            </button>

            <button
                onClick={() => {/* TODO: 로그 수동 새로고침 */}}
                className="px-3 py-1 rounded-md text-xs bg-white/10 text-white/90 border border-white/20 hover:bg-white/20"
                title="로그 새로고침"
            >
                <RotateCcw className="inline w-4 h-4 mr-1" />
                새로고침
            </button>
        </div>
    )
}
