// app/llm/features/components/mcp/UI/SpotifyLoginStatus.tsx
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { http } from '@/app/lib/http'
import { toast } from '@/app/common/toast/useToastStore'
import {
    Headphones,
    CheckCircle2,
    XCircle,
    RefreshCw,
    LogIn,
    Loader2,
} from 'lucide-react'

type StatusRes = { logged_in: boolean }

const MCP_BASE = (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'
const ORIGIN = new URL(MCP_BASE).origin

export function SpotifyLoginStatus() {
    const [status, setStatus] = useState<'unknown' | 'on' | 'off'>('unknown')
    const [busy, setBusy] = useState(false)
    const popupRef = useRef<Window | null>(null)
    const mountedRef = useRef(true)

    const fetchStatus = useCallback(async (signal?: AbortSignal) => {
        setBusy(true)
        try {
            const { data } = await http.get<StatusRes>('/mcp/integrations/spotify/status', { signal })
            if (!mountedRef.current) return
            setStatus(data?.logged_in ? 'on' : 'off')
        } catch {
            if (!mountedRef.current) return
            setStatus('off')
        } finally {
            if (mountedRef.current) setBusy(false)
        }
    }, [])

    useEffect(() => {
        mountedRef.current = true
        const ac = new AbortController()
        fetchStatus(ac.signal)

        const onMessage = (e: MessageEvent) => {
            if (e.origin !== ORIGIN) return
            if (e.data?.type === 'spotify-login') {
                fetchStatus()
                try { popupRef.current?.close() } catch {}
            }
        }

        window.addEventListener('message', onMessage)
        return () => {
            mountedRef.current = false
            ac.abort()
            window.removeEventListener('message', onMessage)
            try { popupRef.current?.close() } catch {}
        }
    }, [fetchStatus])

    const openLogin = useCallback(() => {
        const url = `${MCP_BASE}/mcp/integrations/spotify/login`
        popupRef.current = window.open(
            url,
            'spotify_login',
            'width=520,height=640,noopener,noreferrer'
        )
        if (!popupRef.current) {
            toast.error({ title: '팝업 차단됨', description: '브라우저 팝업을 허용해 주세요.', compact: true })
        }
    }, [])

    return (
        <div className="mt-1 text-[10px]">
            <div
                className={clsx(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1',
                    'bg-white/5 border-white/10 text-white/85',
                    'whitespace-nowrap max-w-full min-w-0'
                )}
            >
                <Headphones className="w-3 h-3 text-green-300/80" />

                <span className="inline-flex items-center gap-1 min-w-0 truncate">
                    {status === 'unknown' && (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                            <span className="truncate">상태 확인 중…</span>
                        </>
                    )}
                    {status === 'on' && (
                        <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
                            <span className="text-emerald-300 truncate">Spotify 로그인됨</span>
                        </>
                    )}
                    {status === 'off' && (
                        <>
                            <XCircle className="w-3 h-3 text-rose-300 shrink-0" />
                            <span className="text-rose-300 truncate">Spotify 로그인 필요</span>
                        </>
                    )}
                </span>

                <div className="ml-2 h-3 w-px bg-white/10" />

                <button
                    type="button"
                    onClick={() => fetchStatus()}
                    disabled={busy}
                    className={clsx(
                        'inline-flex items-center gap-1 rounded px-1 py-0.5',
                        'border border-white/10 hover:bg-white/10 transition',
                        'text-[10px] shrink-0',
                        busy && 'opacity-60 cursor-not-allowed'
                    )}
                    title="상태 새로고침"
                >
                    <RefreshCw className={clsx('w-3 h-3', busy && 'animate-spin')} />
                    새로고침
                </button>

                {status !== 'on' && (
                    <button
                        type="button"
                        onClick={openLogin}
                        className={clsx(
                            'ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5',
                            'border border-indigo-400/40 text-indigo-200 hover:bg-indigo-500/10 transition',
                            'text-[10px] shrink-0'
                        )}
                        title="Spotify 로그인"
                    >
                        <LogIn className="w-3 h-3" />
                        로그인
                    </button>
                )}
            </div>
        </div>
    )
}
