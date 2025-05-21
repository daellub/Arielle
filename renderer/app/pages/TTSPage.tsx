// app/pages/TTSPage.tsx
'use client'

import { useState } from 'react'
import { AudioLines, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './TTSPage.module.css'

export default function TTSPage() {
    const [inputText, setInputText] = useState('')
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
    const [isSynthesizing, setIsSynthesizing] = useState(false)

    const handleSynthesize = () => {
        setIsSynthesizing(true)
        // 테스트용 mock
        setTimeout(() => {
            setGeneratedAudioUrl('/sample_audio.mp3')
            setIsSynthesizing(false)
        }, 1500)
    }

    return (
        <div className={styles.container}>
            {/* 배경 블러 */}
            <div className="fixed top-[-50px] right-[-100px] w-[500px] h-[500px] bg-[#ffc8bb] rounded-full blur-[180px] opacity-20 z-0" />
            <div className="fixed bottom-[-80px] left-[-120px] w-[300px] h-[300px] bg-[#ffe4dc] rounded-full blur-[150px] opacity-10 z-0" />

            <div className="flex-1 overflow-y-auto relative z-10">
                <div className="max-w-screen-xl mx-auto px-20 py-12 space-y-10">
                    <div className="flex items-center gap-3 mb-4">
                        <AudioLines className="w-6 h-6 text-[#ff8a7c] drop-shadow" />
                        <h1 className="text-3xl font-bold text-[#ffc8bb] tracking-wide drop-shadow-sm">
                            Arielle <span className="font-light text-[#ffbdb5]">TTS Panel</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-3 space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-sm space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">모델 선택</label>
                                    <select className="bg-white/10 rounded px-3 py-2 text-white/90 w-full">
                                        <option className='text-black'>Style-BERT-VITS2</option>
                                        <option className='text-black'>Bark</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">음색 스타일</label>
                                    <select className="bg-white/10 rounded px-3 py-2 text-white/90 w-full">
                                        <option className='text-black'>Reika (Neutral)</option>
                                        <option className='text-black'>Reika (Angry)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">말하는 속도</label>
                                    <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" className="w-full accent-pink-300" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-white/60">감정 강도</label>
                                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.5" className="w-full accent-pink-300" />
                                </div>
                            </div>
                        </div>

                        {/* Center: 텍스트 입력 및 실행 */}
                        <div className="col-span-6 flex flex-col gap-6 bg-white/5 border border-white/10 p-8 rounded-[28px] backdrop-blur-xl shadow-[0_8px_32px_rgba(255,255,255,0.05)]">
                            <textarea
                                placeholder="여기에 텍스트를 입력하거나 ASR 결과를 가져옵니다"
                                className="w-full h-40 bg-white/10 rounded-xl p-4 text-white/90 placeholder-white/40 resize-none"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <motion.button
                                onClick={handleSynthesize}
                                disabled={isSynthesizing || !inputText.trim()}
                                className="self-start bg-[#ffb3ab] text-[#662222] font-semibold px-6 py-2 rounded-full hover:brightness-110 transition disabled:opacity-60 flex items-center gap-2"
                                whileTap={{ scale: 0.95 }}
                            >
                                {isSynthesizing ? (
                                    <>
                                        <Loader2 className="animate-spin w-4 h-4" />
                                        합성 중...
                                    </>
                                ) : (
                                    <>
                                        <span>음성 합성하기</span>
                                    </>
                                )}
                            </motion.button>

                            {generatedAudioUrl && (
                                <div className="bg-white/10 p-4 rounded-xl">
                                    <audio controls className="w-full">
                                        <source src={generatedAudioUrl} type="audio/mpeg" />
                                    </audio>
                                </div>
                            )}
                        </div>

                        {/* Right: 히스토리 또는 향후 확장 */}
                        <div className="col-span-3">
                            {/* 나중에 히스토리 or 프리뷰 카드 등 추가 가능 */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}