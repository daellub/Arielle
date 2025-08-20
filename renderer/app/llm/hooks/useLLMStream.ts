// app/llm/hooks/useLLMStream.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useIntegrationExecutor } from './useIntegrationExecutor'
import { http } from '@/app/lib/http'
import { toast } from '@/app/common/toast/useToastStore'

// import { useExpressionSocket } from '@/app/vrm/hooks/useExpressionSocket'

type ToolCallPayload = Record<string, unknown>

type WSInteractionEvent = {
    type: 'interaction_id'
    id: number
    translated?: string
    ja_translated?: string
    emotion?: string
    tone?: string
    blendshape?: string
    toolCall?: { integration?: string } & ToolCallPayload
}

type ToolCard = {
    integration: string
    title?: string
    summary?: string
    items?: Array<{ title: string; sub?: string; href?: string }>
}

const WS_URL =
    (process.env.NEXT_PUBLIC_BACKEND_WS_URL as string) ??
    'ws://localhost:8000/llm/ws/chat'

export function useLLMStream() {
    const wsRef = useRef<WebSocket | null>(null)
    const heartbeatRef = useRef<number | null>(null)
    const reconnectTimerRef = useRef<number | null>(null)
    const backoffAttemptRef = useRef(0)
    const manualCloseRef = useRef(false)

    const addMessage = useLLMStore((s) => s.addMessage)
    const addStreamingChunk = useLLMStore((s) => s.addStreamingChunk)
    const finalizeMessage = useLLMStore((s) => s.finalizeMessage)

    const { execute } = useIntegrationExecutor()

    const [isConnected, setIsConnected] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const clearHeartbeat = () => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current)
            heartbeatRef.current = null
        }
    }

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }
    }

    const startHeartbeat = () => {
        clearHeartbeat()
        heartbeatRef.current = window.setInterval(() => {
            const ws = wsRef.current
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send('{"type":"ping"}')
                } catch {}
            }
        }, 20000)
    }

    const scheduleReconnect = useCallback(() => {
        if (manualCloseRef.current) return
        clearReconnectTimer()
        const base = Math.min(1000 * 2 ** backoffAttemptRef.current, 15000)
        const jitter = Math.floor(Math.random() * 500)
        const delay = base + jitter
        reconnectTimerRef.current = window.setTimeout(() => {
            backoffAttemptRef.current += 1
            connectWebSocket()
        }, delay)
    }, [])

    const injectToolCard = (card: ToolCard) => {
        const s: any = useLLMStore.getState()
        if (typeof s.addToolCard === 'function') {
            s.addToolCard(card)
        } else {
            toast.info({
                key: 'toolcard-info',
                title: card.title ?? '도구 실행 결과',
                description: card.summary ?? card.integration,
                duration: 4000,
            })
        }
    }

    const normalizeToolCard = (toolCall: any, result: any): ToolCard => {
        const integration = toolCall?.integration ?? 'Tool'
        if (result && Array.isArray(result.items)) {
            return {
                integration,
                title: toolCall?.action ?? '도구 실행 결과',
                summary: result.summary ?? undefined,
                items: result.items.slice(0, 5).map((r: any) => ({
                    title: r.title ?? r.name ?? r.url ?? '항목',
                    sub: r.sub ?? r.snippet ?? r.description,
                    href: r.href ?? r.url,
                })),
            }
        }

        return {
            integration,
            title: toolCall?.action ?? '도구 실행 결과',
            summary:
                (typeof result === 'string' && result) ||
                (result?.message as string) ||
                '처리가 완료되었습니다.',
        }
    }

    const connectWebSocket = useCallback(() => {
        clearHeartbeat()
        clearReconnectTimer()
        if (wsRef.current) {
            try {
                wsRef.current.onopen = null
                wsRef.current.onmessage = null
                wsRef.current.onclose = null
                wsRef.current.onerror = null
                wsRef.current.close()
            } catch {}
        }

        manualCloseRef.current = false
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            setIsConnected(true)
            backoffAttemptRef.current = 0
            startHeartbeat()
            toast.success({ key: 'ws-connected', title: 'LLM 연결됨', compact: true, duration: 1200 })
        }

        ws.onmessage = async (event) => {
            const data = event.data

            if (data === '[DONE]') {
                finalizeMessage()
                useLLMStore.getState().setStreaming(false)
                return
            }

            try {
                const parsed = JSON.parse(data) as unknown
                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    (parsed as any).type === 'interaction_id'
                ) {
                    const evt = parsed as WSInteractionEvent

                    if (evt.toolCall?.integration) {
                        Promise.resolve(
                            execute({
                                integration: evt.toolCall.integration,
                                action: typeof evt.toolCall.action === 'string' ? evt.toolCall.action : '',
                                query: typeof evt.toolCall.query === 'string' ? evt.toolCall.query : undefined,
                                ...evt.toolCall,
                            })  
                        )
                            .then((res) => injectToolCard(normalizeToolCard(evt.toolCall, res)))
                            .catch((e) =>
                                injectToolCard({
                                    integration: evt.toolCall!.integration!,
                                    title: '도구 실행 실패',
                                    summary: e instanceof Error ? e.message : '알 수 없는 오류',
                                })
                            )
                    }

                    useLLMStore.setState((state) => {
                        const msgs = [...state.messages]
                        const last = [...msgs]
                            .reverse()
                            .find((m) => m.role === 'assistant' && !m.interactionId)
                        if (last) {
                            last.interactionId = evt.id
                            last.translatedMessage = evt.translated
                            last.jaTranslatedMessage = evt.ja_translated
                            last.isFinal = true
                        } else {
                            console.warn('[interaction_id] 마지막 메시지 없음', msgs)
                        }
                        return { messages: msgs }
                    })

                    useLLMStore
                        .getState()
                        .updateEmotionTone(
                            evt.id,
                            evt.emotion ?? 'neutral',
                            evt.tone ?? 'neutral',
                            evt.blendshape ?? 'neutral'
                        )

                    const jaText = evt.ja_translated
                    const autoSpeak = useLLMStore.getState().autoSpeakEnabled
                    if (jaText && autoSpeak) {
                        try {
                            const { data } = await http.post('/tts/synthesize', {
                                text: jaText,
                            })
                            if (data?.audioUrl) {
                                if (!audioRef.current) {
                                    audioRef.current = new Audio()
                                }
                                audioRef.current.src = data.audioUrl
                                await audioRef.current.play().catch(() => {})
                            }
                        } catch (err) {
                            toast.error({ key: 'tts-fail', title: 'TTS 실패', description: '오디오 재생에 실패했어요.', compact: true })
                        }
                    }

                    useLLMStore.getState().setStreaming(false)
                    return
                }

                if (typeof parsed === 'number') {
                    useLLMStore.getState().addStreamingChunk('assistant', String(parsed))
                    useLLMStore.getState().setStreaming(true)
                    return
                }
                if (typeof parsed === 'string') {
                    useLLMStore.getState().addStreamingChunk('assistant', parsed)
                    useLLMStore.getState().setStreaming(true)
                    return
                }

                return
            } catch {
                const state = useLLMStore.getState()
                const msgs = state.messages
                const last = msgs[msgs.length - 1]
                if (!last || last.role !== 'assistant') {
                    state.addMessage({
                        role: 'assistant',
                        message: '',
                        translatedMessage: '',
                        name: 'Arielle',
                        isFinal: false,
                    })
                }
                state.setStreaming(true)
                state.addStreamingChunk('assistant', data)
            }
        }

        ws.onclose = () => {
            setIsConnected(false)
            clearHeartbeat()
            finalizeMessage()
            useLLMStore.getState().setStreaming(false)
            if (!manualCloseRef.current) {
                toast.info({ key: 'ws-reconnect', title: '연결 끊김', description: '재연결 시도 중…', compact: true, duration: 1800 })
                scheduleReconnect()
            }
        }

        ws.onerror = (err) => {
            setIsConnected(false)
            try {
                ws.close()
            } catch {}
        }
    }, [finalizeMessage, scheduleReconnect, execute])

    const ensureOpenAnd = useCallback((fn: () => void) => {
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN) {
            fn()
            return
        }
        toast.info({ key: 'ws-unstable', title: '연결 불안정', description: '재연결 시도 중…', compact: true, duration: 1500 })
        connectWebSocket()
        setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) fn()
        }, 300)
    }, [connectWebSocket])

    const send = useCallback((input: string) => {
        const modelId = useMCPStore.getState().activeModelId
        const config = useMCPStore.getState().getCurrentConfig()

        if (!modelId || !config?.enabled) {
            toast.error({ key: 'no-model', title: 'MCP 비활성', description: '활성화된 MCP 모델이 없습니다.', compact: true })
            return
        }
        if (!config.model_key) {
            toast.error({ key: 'no-key', title: '모델 키 없음', description: '모델 키를 설정해주세요.', compact: true })
            return
        }

        const messages = useLLMStore.getState().messages
        const recentWindow = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-16)
            .map((m) => ({ role: m.role, content: m.message }))

        recentWindow.push({ role: 'user', content: input })

        const payload = {
            model_id: modelId,
            messages: recentWindow,
        }

        ensureOpenAnd(() => {
            try {
                wsRef.current?.send(JSON.stringify(payload))
                useLLMStore.getState().setStreaming(true)
            } catch (e) {
                toast.error({ key: 'send-fail', title: '전송 실패', description: '메시지 전송 중 오류가 발생했습니다.' })
            }
        })
    }, [ensureOpenAnd])

    const stop = useCallback(() => {
        manualCloseRef.current = true
        try {
            wsRef.current?.close()
        } catch {}
        finalizeMessage()
        useLLMStore.getState().setStreaming(false)
    }, [finalizeMessage])

    const reconnect = useCallback(() => {
        manualCloseRef.current = false
        toast.info({ key: 'ws-manual-reconnect', title: '재연결', description: 'WebSocket 재연결 시도…', compact: true })
        connectWebSocket()
    }, [connectWebSocket])

    return { send, isConnected, reconnect, stop }
}
