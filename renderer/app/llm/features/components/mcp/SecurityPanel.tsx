'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
    ShieldAlert,
    Link2,
    Clock,
    Key,
    ToggleLeft,
    ToggleRight,
    Save,
    X,
    Pen
} from 'lucide-react'
import clsx from 'clsx'

export default function SecurityPanel() {
    const [requireApiKey, setRequireApiKey] = useState(true)
    const [allowedOrigins, setAllowedOrigins] = useState('https://example.com, http://localhost:3000')
    const [rateLimit, setRateLimit] = useState(10)
    const [useJwt, setUseJwt] = useState(true)
    const [authBypass, setAuthBypass] = useState(false)
    const [showOriginsModal, setShowOriginsModal] = useState(false)
    const [tempOrigins, setTempOrigins] = useState(allowedOrigins)

    const saveOrigins = () => {
        setAllowedOrigins(tempOrigins)
        setShowOriginsModal(false)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldAlert className="w-4 h-4 text-white/70" />
                <span>Security 설정</span>
            </div>

            {/* API Key Required */}
            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-white">API Key Required</span>
                <button
                    onClick={() => setRequireApiKey(!requireApiKey)}
                    className="text-white/40 hover:text-white"
                >
                    {requireApiKey
                        ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/40" />
                    }
                </button>
            </div>

            {/* Allowed Origins */}
            <div className="p-2 bg-white/5 rounded">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <span className="text-sm text-white font-medium">Allowed Origins</span>
                        <div className="text-white/40 text-[10px]">쉼표로 구분된 도메인</div>
                    </div>
                    <button
                        className="text-white/40 hover:text-white"
                        onClick={() => { setTempOrigins(allowedOrigins); setShowOriginsModal(true) }}
                    >
                        <Pen className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-1 text-white/40 text-[10px] break-all">
                    <Link2 className="w-4 h-4" />
                    <span>{allowedOrigins}</span>
                </div>
            </div>

            {/* Rate Limit */}
            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white font-medium">Rate Limit</span>
                </div>
                <input
                    type="number"
                    min={1}
                    value={rateLimit}
                    onChange={e => setRateLimit(Number(e.target.value))}
                    className="bg-white/10 text-white text-sm rounded px-2 py-1 w-[80px]"
                />
            </div>

            {/* JWT Auth */}
            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1">
                    <Key className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white">JWT 인증 사용</span>
                </div>
                <button
                    onClick={() => setUseJwt(!useJwt)}
                    className="text-white/40 hover:text-white"
                >
                    {useJwt
                        ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/40" />
                    }
                </button>
            </div>

            {/* Auth Bypass */}
            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-red-400 font-medium">⛔ 인증 비활성화</span>
                <button
                    onClick={() => setAuthBypass(!authBypass)}
                    className="text-white/40 hover:text-red-400"
                >
                    {authBypass
                        ? <ToggleRight className="w-5 h-5 text-red-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/40" />
                    }
                </button>
            </div>

            {/* Origins Edit Modal */}
            {showOriginsModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowOriginsModal(false)}
                >
                    <div
                        className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-full max-w-sm overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Save className="w-5 h-5 text-white/60" />
                                Allowed Origins 편집
                            </h4>
                            <button
                                onClick={() => setShowOriginsModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            className="w-full p-2 rounded bg-white/10 text-white text-sm placeholder-white/30 resize-none"
                            value={tempOrigins}
                            onChange={e => setTempOrigins(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowOriginsModal(false)}
                                className="text-xs text-white/50"
                            >취소</button>
                            <button
                                onClick={saveOrigins}
                                className="text-xs text-indigo-300 flex items-center gap-1"
                            >
                                <Save className="w-4 h-4" /> 저장
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}