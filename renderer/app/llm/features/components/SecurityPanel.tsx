'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

export default function SecurityPanel() {
    const [requireApiKey, setRequireApiKey] = useState(true)
    const [allowedOrigins, setAllowedOrigins] = useState('https://example.com, http://localhost:3000')
    const [rateLimit, setRateLimit] = useState(10)
    const [useJwt, setUseJwt] = useState(true)
    const [authBypass, setAuthBypass] = useState(false)

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 font-semibold text-white">
                <ShieldAlert className="w-4 h-4 text-white/70" />
                Security 설정
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-white font-medium">API Key Required</span>
                    <input
                        type="checkbox"
                        checked={requireApiKey}
                        onChange={() => setRequireApiKey(!requireApiKey)}
                        className="w-4 h-4 accent-indigo-500"
                    />
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Allowed Origins</span>
                        <span className="text-white/40 text-[10px]">쉼표로 구분된 도메인</span>
                    </div>
                    <textarea
                        rows={2}
                        value={allowedOrigins}
                        onChange={(e) => setAllowedOrigins(e.target.value)}
                        className="bg-white/10 text-white rounded px-2 py-1 text-xs w-[170px] resize-none"
                    />
                </div>

                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <span className="text-white font-medium">Rate Limit</span>
                        <span className="text-white/40 text-[10px]">요청/분</span>
                    </div>
                    <input
                        type="number"
                        value={rateLimit}
                        onChange={(e) => setRateLimit(Number(e.target.value))}
                        className="bg-white/10 text-white rounded px-2 py-1 w-[80px]"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-white font-medium">JWT 인증 사용</span>
                    <input
                        type="checkbox"
                        checked={useJwt}
                        onChange={() => setUseJwt(!useJwt)}
                        className="w-4 h-4 accent-indigo-500"
                    />
                </div>

                <div className="flex justify-between items-center pt-2">
                    <span className="text-red-400 font-medium">⛔ 인증 비활성화</span>
                    <input
                        type="checkbox"
                        checked={authBypass}
                        onChange={() => setAuthBypass(!authBypass)}
                        className="w-4 h-4 accent-red-400"
                    />
                </div>
            </div>
        </div>
    )
}
