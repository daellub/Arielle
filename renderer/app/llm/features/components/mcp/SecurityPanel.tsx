'use client'

import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
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
import useSecurityStore from '@/app/llm/features/store/useSecurityStore'

export default function SecurityPanel() {
    const {
        apiKeyRequired,
        allowedOrigins,
        rateLimit,
        useJWT,
        disableAuth,
        updateSecuritySettings
    } = useSecurityStore(state => state)

    const [showOriginsModal, setShowOriginsModal] = useState(false)
    const [tempOrigins, setTempOrigins] = useState(allowedOrigins)
    const saveTimer = useRef<NodeJS.Timeout | null>(null)

    const saveOrigins = () => {
        updateSecuritySettings({ allowedOrigins: tempOrigins })
        setShowOriginsModal(false)
    }

    useEffect(() => {
        axios.get('http://localhost:8500/mcp/api/security/settings')
            .then(res => {
                const { api_key_required, allowed_origins, rate_limit, use_jwt, disable_auth } = res.data
                updateSecuritySettings({
                    apiKeyRequired: api_key_required,
                    allowedOrigins: allowed_origins,
                    rateLimit: rate_limit,
                    useJWT: use_jwt,
                    disableAuth: disable_auth
                })
            })
            .catch(err => {
                if (err.response?.status === 404) {
                    axios.post('http://localhost:8500/mcp/api/security/settings', {
                        api_key_required: apiKeyRequired,
                        allowed_origins: allowedOrigins,
                        rate_limit: rateLimit,
                        use_jwt: useJWT,
                        disable_auth: disableAuth
                    }).then(() => console.log('기본 보안 설정 저장됨'))
                    .catch(console.error)
                } else {
                    console.error('보안 설정 불러오기 실패:', err)
                }
            })
    }, [])

    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            axios.patch('http://localhost:8500/mcp/api/security/settings', {
                api_key_required: apiKeyRequired,
                allowed_origins: allowedOrigins,
                rate_limit: rateLimit,
                use_jwt: useJWT,
                disable_auth: disableAuth
            }).catch(console.error)
        }, 1000)

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [apiKeyRequired, allowedOrigins, rateLimit, useJWT, disableAuth])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldAlert className="w-4 h-4 text-white/70" />
                <span>Security 설정</span>
            </div>

            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-white">API Key Required</span>
                <button onClick={() => updateSecuritySettings({ apiKeyRequired: !apiKeyRequired })}>
                    {apiKeyRequired
                        ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/40" />
                    }
                </button>
            </div>

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
                        <Pen className="w-4 h-4 text-white/40 hover:text-white" />
                    </button>
                </div>
                <div className="flex items-center gap-1 text-white/40 text-[10px] break-all">
                    <Link2 className="w-4 h-4" />
                    <span>{allowedOrigins}</span>
                </div>
            </div>

            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white font-medium">Rate Limit</span>
                </div>
                <input
                    type="number"
                    min={1}
                    value={rateLimit}
                    onChange={e => updateSecuritySettings({ rateLimit: Number(e.target.value) })}
                    className="bg-white/10 text-white text-sm rounded px-2 py-1 w-[80px]"
                />
            </div>

            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <div className="flex items-center gap-1">
                    <Key className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white">JWT 인증 사용</span>
                </div>
                <button onClick={() => updateSecuritySettings({ useJWT: !useJWT })}>
                    {useJWT
                        ? <ToggleRight className="w-5 h-5 text-indigo-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/40" />
                    }
                </button>
            </div>

            <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-red-400 font-medium">⛔ 인증 비활성화</span>
                <button onClick={() => updateSecuritySettings({ disableAuth: !disableAuth })}>
                    {disableAuth
                        ? <ToggleRight className="w-5 h-5 text-red-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/40" />
                    }
                </button>
            </div>

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