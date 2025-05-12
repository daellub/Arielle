'use client'

import { motion } from 'motion/react'
import { Mic, Volume2, Languages, Brain, User, Database, Bot } from 'lucide-react'
import clsx from 'clsx'

const glowStyle = {
    boxShadow: '0 0 10px rgba(99, 102, 241, 0.3), 0 0 20px rgba(99, 102, 241, 0.4)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    animation: 'glowPulse 1.6s ease-in-out infinite',
    borderRadius: '0.75rem',
}

export default function HomeDetail({ onBack }: { onBack: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full px-60 py-15 overflow-y-auto"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Arielle 기능 개요</h2>
                <button
                    onClick={onBack}
                    className="text-sm px-4 py-2 border rounded hover:bg-gray-100 transition"
                >
                    돌아가기
                </button>
            </div>

            <section className="space-y-6">
                <div>
                    <div className='flex items-center justify-between px-85 mb-4'>
                        <h2 className="text-2xl font-semibold text-gray-800">음성 인식</h2>
                        <h2 className="text-2xl font-semibold text-gray-800">TTS 결과</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                            {['"오늘 날씨 어때?"', '"다시 말해줘."'].map((text, i) => (
                                <div
                                    key={i}
                                    style={i === 0 ? glowStyle : undefined}
                                    className={clsx(
                                        'bg-white rounded-xl px-3 py-2 shadow flex flex-col justify-between text-sm text-gray-700 transition-shadow',
                                        'hover:shadow-[0_0_18px_rgba(139,92,246,0.4)]'
                                    )}
                                >
                                    <span><Mic className="w-4 h-4 inline text-purple-500 mr-1" />{text}</span>
                                    <div className="flex justify-end mt-2">
                                        <span className="text-xs text-gray-400">{i === 0 ? '10초 전' : '25초 전'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col space-y-2">
                            {[
                                '"네, 오늘 날씨는 맑고 따뜻할 예정이에요."',
                                '"다시 설명드릴게요. 다음 문장을 들어보세요."',
                            ].map((text, i) => (
                                <div
                                    key={i}
                                    style={i === 0 ? glowStyle : undefined}
                                    className={clsx(
                                        'bg-white rounded-xl px-3 py-2 shadow flex flex-col justify-between text-sm text-gray-700 transition-shadow',
                                        'hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]'
                                    )}
                                >
                                    <span><Volume2 className="w-4 h-4 inline text-blue-500 mr-1" />{text}</span>
                                    <div className="flex justify-end mt-2">
                                        <span className="text-xs text-gray-400">{i === 0 ? '10초 전' : '25초 전'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className='flex items-center justify-between px-85 mb-4'>
                        <h2 className="text-2xl font-semibold text-gray-800">최근 번역</h2>
                        <h2 className="text-2xl font-semibold text-gray-800">LLM 답변</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                        <div className="flex flex-col space-y-2">
                            {['"안녕하세요"', '"고마워요"'].map((text, i) => (
                                <div
                                    key={i}
                                    style={i === 0 ? glowStyle : undefined}
                                    className={clsx(
                                        'bg-white h-full rounded-2xl px-3 py-2 shadow-md flex flex-col justify-between text-sm text-gray-700 transition-shadow',
                                        'hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]'
                                    )}
                                >
                                    <p className="font-semibold"><Languages className='w-4 h-4 inline mr-1 text-blue-500' />{text}</p>
                                    <div className="flex justify-between mx-1">
                                        <p className="text-gray-500">→ {i === 0 ? '"Hello"' : '"Thank you"'}</p>
                                        <p className="text-xs text-gray-400">{i === 0 ? '5초 전' : '20초 전'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col space-y-2">
                            {[
                                '"안녕하세요. 무엇을 도와드릴까요?"',
                                '"감사합니다. 언제든 다시 불러주세요."',
                            ].map((text, i) => (
                                <div
                                    key={i}
                                    style={i === 0 ? glowStyle : undefined}
                                    className={clsx(
                                        'bg-white h-full rounded-2xl px-3 py-2 shadow-md flex flex-col justify-between text-sm text-gray-700 transition-shadow',
                                        'hover:shadow-[0_0_18px_rgba(244,63,94,0.4)]'
                                    )}
                                >
                                    <p><Bot className="w-4 h-4 inline mr-1 text-rose-500" /> {text}</p>
                                    <div className="flex justify-end mt-2">
                                        <p className="text-xs text-gray-400">{i === 0 ? '4초 전' : '18초 전'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">시스템 상태</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: <Mic className="w-4 h-4 text-purple-500" />, label: 'ASR', desc: 'Azure Speech 연결됨' },
                            { icon: <Languages className="w-4 h-4 text-blue-500" />, label: 'Translate', desc: 'Azure Translator 사용 중' },
                            { icon: <Brain className="w-4 h-4 text-pink-500" />, label: 'LLM', desc: '활성화됨 (pantheon-rp)' },
                            { icon: <Volume2 className="w-4 h-4 text-gray-700" />, label: 'TTS', desc: '로컬 모델 응답 가능' },
                            { icon: <User className="w-4 h-4 text-indigo-500" />, label: 'VRM', desc: '모델 로드됨 (arielle.vrm)' },
                            { icon: <Database className="w-4 h-4 text-green-600" />, label: 'DB', desc: 'MySQL 연결 완료' },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="bg-white p-3 rounded-xl shadow text-sm flex items-start gap-2 transition-shadow hover:shadow-lg hover:shadow-indigo-200"
                            >
                                {item.icon}
                                <div>
                                    <p className="font-semibold">{item.label}</p>
                                    <p className="text-gray-600">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </motion.div>
    )
}
