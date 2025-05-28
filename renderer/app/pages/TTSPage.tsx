// app/pages/TTSPage.tsx
'use client'

import { useState } from 'react'
import AuroraText from '@/app/tts/components/aurora/AuroraText'
import TTSInputPanel from '@/app/tts/components/TTSInputPanel'
import TTSOutputPanel from '@/app/tts/components/TTSOutputPanel'
import TTSHistoryCard from '@/app/tts/components/TTSHistoryCard'
import TTSCharacterCard from '@/app/tts/components/TTSCharacterCard'
import { AudioLines } from 'lucide-react'
import FadeInSection from '@/app/components/common/FadeInSection'
import BackgroundChroma from '@/app/tts/components/BackgroundChroma'
import ParticleOverlay from '@/app/tts/components/ParticleOverlay'
import { synthesizeTTS } from '@/app/tts/api/synthesize'

const whisperLines = [
    "달빛은 조용히 속삭이고 있어요...",
    "숨결처럼 흐르는 목소리예요.",
    "귀 기울이면 들리는 작은 울림이죠.",
    "별빛에 실린 말, 기억하고 있나요?",
    "그녀는 말없이 노래하고 있어요.",
    "이건, 잊히지 않는 속삭임입니다.",
    "바람결에 녹아든 목소리예요."
]

export default function TTSPage() {
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [history, setHistory] = useState<
        { text: string; audioUrl: string; timestamp: string }[]
    >([])
    const [whisperLine, setWhisperLine] = useState<string | null>(null)

    const handleSynthesize = async (text: string) => {
        try {
            const url = await synthesizeTTS(text)
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
            setAudioUrl(url)
            setHistory([{ text, audioUrl: url, timestamp: now }, ...history])
    
            const random = whisperLines[Math.floor(Math.random() * whisperLines.length)]
            setWhisperLine(random)
        } catch (err) {
            console.error('TTS synthesis failed:', err)
        }
    }

    const handleDelete = (idx: number) => {
        setHistory((prev) => prev.filter((_, i) => i !== idx))
    }

    return (
        <div className="scrollLLMArea w-full h-full bg-gradient-to-br from-[#151123] to-[#211b39] text-[#f0eaff] relative overflow-y-auto py-12 px-30">
            <BackgroundChroma />
            <ParticleOverlay />

            {/* 배경 레이어 */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[url('/assets/noise.png')] opacity-[0.06] mix-blend-soft-light" />
            <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#a56eff] blur-[180px] opacity-30 rounded-full z-0" />
            <div className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#7ee8fa] blur-[160px] opacity-20 rounded-full z-0" />
            
            <div className="relative z-10 max-w-screen-xl mx-auto space-y-8">
                
                {/* 헤더 */}
                <FadeInSection delay={0.1}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <TTSCharacterCard />
                        <div className='flex items-center gap-5'>
                            <AudioLines className="w-8 h-8 text-[#a56eff] opacity-80" />
                            <AuroraText size="md" glitch>
                                Arielle TTS Panel
                            </AuroraText>
                        </div>
                    </div>
                </FadeInSection>

                {/* 입력 + 출력 */}
                <FadeInSection delay={0.2}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-7">
                            <TTSInputPanel onSynthesize={handleSynthesize} isLoading={false} />
                        </div>
                        <div className="lg:col-span-5 space-y-6">
                            <TTSOutputPanel audioUrl={audioUrl} whisperLine={whisperLine} />
                        </div>
                    </div>
                </FadeInSection>

                {/* 최근 히스토리 카드 */}
                {history.length > 0 && (
                    <FadeInSection delay={0.3}>
                        <div className="space-y-2 mt-12">
                            <h3 className="text-sm text-[#ccc] font-semibold tracking-widest uppercase">최근 생성된 음성</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {history.slice(0, 3).map((item, idx) => (
                                    <FadeInSection key={idx} delay={0.4 + idx * 0.1}>
                                        <TTSHistoryCard
                                            text={item.text}
                                            audioUrl={item.audioUrl}
                                            timestamp={item.timestamp}
                                            onDelete={() => handleDelete(idx)}
                                            onDownload={() => {
                                                const a = document.createElement('a')
                                                a.href = item.audioUrl
                                                a.download = 'tts_output.wav'
                                                a.click()
                                            }}
                                        />
                                    </FadeInSection>
                                ))}
                            </div>
                        </div>
                    </FadeInSection>
                )}
            </div>
        </div>
    )
}
