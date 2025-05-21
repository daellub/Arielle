// app/llm/features/components/mcp/UI/SpotifyLoginStatus.tsx
'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

export function SpotifyLoginStatus() {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get('http://localhost:8500/mcp/integrations/spotify/status')
                setLoggedIn(res.data.logged_in)
            } catch {
                setLoggedIn(false)
            }
        }

        checkStatus()

        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'spotify-login' && e.data.success) {
                console.log('[🎧 postMessage 수신됨]')
                checkStatus()
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    if (loggedIn === null) return null

    return (
        <div className="mt-1 text-[10px] flex items-center gap-2">
            {loggedIn ? (
                <span className="text-green-400">Spotify 로그인됨</span>
            ) : (
                <>
                    <span className="text-red-400">Spotify 로그인 필요</span>
                    <a
                        onClick={() => {
                            window.open(
                                'http://localhost:8500/mcp/integrations/spotify/login',
                                '_blank',
                                'width=500,height=600'
                            )
                        }}
                        className="text-blue-400 underline cursor-pointer"
                    >
                        로그인 하러 가기
                    </a>
                </>
            )}
        </div>
    )
}
