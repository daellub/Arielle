// app/tts/components/TTSOutputPanel.tsx
'use client'

import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import './customPlayer.css'
import { useEffect, useRef, useState, memo } from 'react'
import WaveVisualizer from './WaveVisualizer'

interface Props {
    audioUrl: string | null
    whisperLine?: string | null
}

function TTSOutputPanel({ audioUrl, whisperLine }: Props) {
    const [typed, setTyped] = useState('')
    const [isPlaying, setIsPlaying] = useState(false)
    const typingTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!whisperLine) return

        setTyped('')
        let i = 0

        const typeNext = () => {
            if (!whisperLine || i >= whisperLine.length) return
            setTyped((prev) => prev + whisperLine[i])
            i++
            typingTimeout.current = setTimeout(typeNext, 40)
        }

        typeNext()

        return () => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current)
        }
    }, [whisperLine])

    return (
        <div className="relative z-10">
            {audioUrl && (
                <>
                    <AudioPlayer
                        src={audioUrl}
                        showJumpControls={false}
                        layout="horizontal"
                        customAdditionalControls={[]}
                        customVolumeControls={[]}
                        onPlay={() => setIsPlaying(true)}
                        onEnded={() => setIsPlaying(false)}
                    />
                    <MemoizedVisualizer active={isPlaying} />
                </>
            )}

            {typed && (
                <p className="mt-2 text-sm text-white font-mono whitespace-pre-line px-2">
                    {typed}
                </p>
            )}
        </div>
    )
}

const MemoizedVisualizer = memo(WaveVisualizer)

export default TTSOutputPanel