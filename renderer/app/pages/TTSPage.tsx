// app/pages/TTSPage.tsx
'use client'

import { useState, useEffect } from 'react'
import { AudioLines } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import styles from './TTSPage.module.css'

export default function TTSPage() {
    const [sparkles, setSparkles] = useState(
        Array.from({ length: 20 }, () => ({
            // top: `${Math.random() * 100}%`,
            // left: `${Math.random() * 100}%`,
            // delay: `${Math.random() * 5}s`,
            // duration: `${3 + Math.random() * 2}s`,
        }))
    )

    const [inputText, setInputText] = useState('')
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)

    const handleSynthesize = () => {
        // 테스트용 mock
        setTimeout(() => {
            setGeneratedAudioUrl('/sample_audio.mp3')
        }, 1000)
    }

    return (
        <div className={styles.container}>
            {/* Blur background */}
            <div className="fixed top-[-50px] right-[-100px] w-[500px] h-[500px] bg-[#ffc8bb] rounded-full blur-[180px] opacity-20 z-0" />
            <div className="fixed bottom-[-80px] left-[-120px] w-[300px] h-[300px] bg-[#ffe4dc] rounded-full blur-[150px] opacity-10 z-0" />

            {/* Sparkles */}
            {sparkles.map((s, i) => (
                <div
                    key={i}
                    className="absolute w-[6px] h-[6px] rounded-full bg-[#fff0ea] blur-[2px] animate-ping z-0"
                    style={{
                        // top: s.top,
                        // left: s.left,
                        // animationDelay: s.delay,
                        // animationDuration: s.duration,
                    }}
                />
            ))}

            <div className="flex-1 overflow-y-auto relative z-10">
                <div className="max-w-screen-xl mx-auto px-20 py-12 space-y-10">
                    <div className="flex items-center gap-3 mb-4">
                        <AudioLines className="w-6 h-6 text-[#ff8a7c] drop-shadow" />
                        <h1 className="text-3xl font-bold text-[#ffc8bb] tracking-wide drop-shadow-sm">
                            Arielle <span className="font-light text-[#ffbdb5]">TTS Panel</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Left panel */}
                        <div className="col-span-3 flex flex-col space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-sm space-y-4">
                                <h2 className="text-sm font-semibold text-white/70">모델 선택</h2>
                                <select className="bg-white/10 rounded px-3 py-2 text-white/90">
                                    <option>Style-BERT-VITS2</option>
                                    <option>Bark</option>
                                </select>

                                <h2 className="text-sm font-semibold text-white/70">음색 선택</h2>
                                <select className="bg-white/10 rounded px-3 py-2 text-white/90">
                                    <option>Reika (Neutral)</option>
                                    <option>Reika (Angry)</option>
                                </select>

                                <h2 className="text-sm font-semibold text-white/70">길이 / 감정</h2>
                                <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" />
                                <input type="range" min="0" max="1" step="0.1" defaultValue="0.5" />
                            </div>
                        </div>

                        {/* Center panel */}
                        <div className="col-span-6 flex flex-col gap-6 bg-white/5 border border-white/10 p-8 rounded-[28px] backdrop-blur-xl shadow-[0_8px_32px_rgba(255,255,255,0.05)]">
                            <textarea
                                placeholder="여기에 텍스트를 입력하거나 ASR 결과를 가져옵니다"
                                className="w-full h-40 bg-white/10 rounded-xl p-4 text-white/90 placeholder-white/40 resize-none"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <button
                                onClick={handleSynthesize}
                                className="self-start bg-[#ffb3ab] text-[#662222] font-semibold px-6 py-2 rounded-full hover:brightness-110 transition"
                            >
                                음성 합성하기
                            </button>

                            {generatedAudioUrl && (
                                <audio controls className="mt-4 w-full">
                                    <source src={generatedAudioUrl} type="audio/mpeg" />
                                </audio>
                            )}
                        </div>

                        {/* Right panel (비워둠 or 향후 히스토리 등) */}
                        <div className="col-span-3">
                            {/* 추후 히스토리 카드나 프리뷰 등 추가 */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
