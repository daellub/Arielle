// app/llm/features/components/mcp/SecurityPanel.tsx
'use client'

import axios from 'axios'
import { useEffect, useState, useRef, useMemo } from 'react'
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
import { toast } from '@/app/common/toast/useToastStore'
import StepperNumber from '@/app/components/ui/StepperNumber'

const API_BASE =
    (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'
const SETTINGS_URL = `${API_BASE}/mcp/api/security/settings`

export default function SecurityPanel() {
    const {
        apiKeyRequired,
        allowedOrigins,
        rateLimit,
        useJWT,
        disableAuth,
        updateSecuritySettings,
        getAllowedOriginList,
    } = useSecurityStore((s) => s)

    const [showOriginsModal, setShowOriginsModal] = useState(false)
    const [tempOrigins, setTempOrigins] = useState(allowedOrigins ?? '')
    const saveTimer = useRef<number | null>(null)

    const originList = useMemo(() => getAllowedOriginList(), [allowedOrigins, getAllowedOriginList])

    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const { data } = await axios.get(SETTINGS_URL)
                if (!mounted) return
                const {
                    api_key_required,
                    allowed_origins,
                    rate_limit,
                    use_jwt,
                    disable_auth,
                } = data || {}
                updateSecuritySettings({
                    apiKeyRequired: !!api_key_required,
                    allowedOrigins: allowed_origins ?? '',
                    rateLimit: Number.isFinite(Number(rate_limit)) ? Number(rate_limit) : 10,
                    useJWT: !!use_jwt,
                    disableAuth: !!disable_auth,
                })
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    try {
                        await axios.post(SETTINGS_URL, {
                            api_key_required: apiKeyRequired,
                            allowed_origins: allowedOrigins,
                            rate_limit: rateLimit,
                            use_jwt: useJWT,
                            disable_auth: disableAuth,
                        })
                        toast.info({ description: '기본 보안 설정이 초기화되었습니다.', compact: true })
                    } catch (e: any) {
                        toast.error({
                            title: '보안 설정 초기화 실패',
                            description: e?.message ?? '알 수 없는 오류',
                            compact: true,
                        })
                    }
                } else {
                toast.error({
                    title: '보안 설정 불러오기 실패',
                    description: err?.message ?? '네트워크 오류',
                    compact: true,
                })
                }
            }
        })()
        return () => {
            mounted = false
        }
    }, [updateSecuritySettings])

    useEffect(() => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current)
        saveTimer.current = window.setTimeout(async () => {
            try {
                await axios.patch(SETTINGS_URL, {
                    api_key_required: apiKeyRequired,
                    allowed_origins: allowedOrigins,
                    rate_limit: rateLimit,
                    use_jwt: useJWT,
                    disable_auth: disableAuth,
                })
            } catch (e: any) {
                toast.error({
                    title: '보안 설정 저장 실패',
                    description: e?.message ?? '변경 사항을 저장하지 못했습니다.',
                    compact: true,
                })
            }
        }, 700)
        return () => {
            if (saveTimer.current) window.clearTimeout(saveTimer.current)
        }
    }, [apiKeyRequired, allowedOrigins, rateLimit, useJWT, disableAuth])

    const openOrigins = () => {
        setTempOrigins(allowedOrigins ?? '')
        setShowOriginsModal(true)
    }

    const saveOrigins = () => {
        updateSecuritySettings({ allowedOrigins: (tempOrigins || '').trim() })
        setShowOriginsModal(false)
        toast.success({ description: '허용 도메인이 업데이트되었습니다.', compact: true })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldAlert className="w-4 h-4 text-white/70" />
                <span>Security 설정</span>
            </div>

            <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-white">API Key Required</span>
                    <button
                        onClick={() =>
                            updateSecuritySettings({ apiKeyRequired: !apiKeyRequired })
                        }
                        aria-label="toggle api key required"
                        className="text-white/80 hover:text-white"
                    >
                        {apiKeyRequired ? (
                            <ToggleRight className="w-5 h-5 text-indigo-400" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-white/40" />
                        )}
                    </button>
                </div>
            </div>

            <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-sm text-white font-medium">Allowed Origins</span>
                        <div className="text-white/40 text-[10px]">줄바꿈 또는 쉼표로 구분</div>
                    </div>
                    <button
                        className="text-white/60 hover:text-white rounded p-1"
                        onClick={openOrigins}
                        aria-label="허용 도메인 편집"
                    >
                        <Pen className="w-4 h-4" />
                    </button>
                </div>

                {originList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {originList.map((o, i) => (
                            <span
                                key={`${o}-${i}`}
                                className="px-2 py-0.5 rounded-md text-[11px] bg-white/10 text-white/85 ring-1 ring-white/10"
                                title={o}
                            >
                                {o}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-white/45 text-[11px]">
                        <Link2 className="w-4 h-4" />
                        <span>(비어 있음)</span>
                    </div>
                )}
            </div>

            <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white font-medium">Rate Limit</span>
                    </div>
                    <StepperNumber
                        value={rateLimit}
                        onChange={(v) => updateSecuritySettings({ rateLimit: v })}
                        min={0}
                        max={10000}
                        step={1}
                        precision={0}
                        className="w-[112px]"
                        ariaLabel="요청 제한"
                    />
                </div>
            </div>

            <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Key className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">JWT 인증 사용</span>
                    </div>
                    <button
                        onClick={() => updateSecuritySettings({ useJWT: !useJWT })}
                        aria-label="toggle jwt"
                        className="text-white/80 hover:text-white"
                    >
                        {useJWT ? (
                            <ToggleRight className="w-5 h-5 text-indigo-400" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-white/40" />
                        )}
                    </button>
                </div>
            </div>

            <div className="rounded-xl p-3 ring-1 ring-red-400/30 bg-red-500/5 hover:bg-red-500/10 transition">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-red-300 font-medium">인증 비활성화</span>
                    <button
                        onClick={() => updateSecuritySettings({ disableAuth: !disableAuth })}
                        aria-label="toggle disable auth"
                    >
                        {disableAuth ? (
                            <ToggleRight className="w-5 h-5 text-red-400" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-white/40" />
                        )}
                    </button>
                </div>
            </div>

            {showOriginsModal &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        className={clsx(
                        'fixed inset-0 z-[9999] p-4 flex items-center justify-center',
                        'bg-gradient-to-br from-black/60 via-[#0b0b18]/50 to-black/60',
                        'backdrop-blur-md'
                        )}
                        onClick={() => setShowOriginsModal(false)}
                    >
                        <div className="pointer-events-none absolute inset-0 opacity-30">
                            <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl bg-indigo-500/20" />
                            <div className="absolute -bottom-24 -right-20 w-[28rem] h-[28rem] rounded-full blur-3xl bg-fuchsia-500/15" />
                        </div>

                        <div
                            className={clsx(
                                'relative w-full max-w-lg rounded-2xl ring-1 ring-white/10',
                                'bg-gradient-to-b from-[#2c2c3d] to-[#262637] p-6 space-y-4',
                                'shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]'
                            )}
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Allowed Origins 편집"
                        >
                            <div className="flex justify-between items-center">
                                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Save className="w-5 h-5 text-white/60" />
                                    Allowed Origins 편집
                                </h4>
                                <button
                                    onClick={() => setShowOriginsModal(false)}
                                    className="text-white/70 hover:text-white rounded-md p-1 transition"
                                    aria-label="닫기"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <textarea
                                rows={6}
                                className={clsx(
                                    'w-full rounded-md bg-white/10 text-white text-sm px-3 py-2',
                                    'focus:outline-none focus:ring-2 focus:ring-indigo-400/40',
                                    'placeholder:text-white/35 resize-none font-mono'
                                )}
                                placeholder={`https://example.com\n*.my-domain.com\nhttps://foo.bar, https://baz.qux`}
                                value={tempOrigins}
                                onChange={(e) => setTempOrigins(e.target.value)}
                            />

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setShowOriginsModal(false)}
                                    className={clsx(
                                        'text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
                                        'text-white/70 hover:text-white bg-white/0 hover:bg-white/10',
                                        'ring-1 ring-white/10 hover:ring-white/20 transition'
                                    )}
                                    type="button"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={saveOrigins}
                                    className="text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white ring-1 ring-indigo-300/40 hover:from-indigo-400 hover:to-fuchsia-400 shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition"
                                    type="button"
                                >
                                    <Save className="w-4 h-4" />
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    )
}