// app/llm/hooks/useLLMStream.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useExpressionSocket } from '@/app/vrm/hooks/useExpressionSocket'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'
import { useMCPStore } from '@/app/llm/features/store/useMCPStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import { useIntegrationExecutor } from './useIntegrationExecutor'

export function useLLMStream() {
    const wsRef = useRef<WebSocket | null>(null)
    const addMessage = useLLMStore((s) => s.addMessage)
    const addStreamingChunk = useLLMStore((s) => s.addStreamingChunk)
    const finalizeMessage = useLLMStore((s) => s.finalizeMessage)
    const notify = useNotificationStore((s) => s.show)

    const { sendExpression } = useExpressionSocket()

    const { execute } = useIntegrationExecutor()

    const [isConnected, setIsConnected] = useState(false)

    const waitForSocketConnection = (callback: () => void) => {
        const socket = wsRef.current
        if (!socket) return

        const wait = () => {
            if (socket.readyState === WebSocket.OPEN) {
                callback()
            } else {
                setTimeout(wait, 100)
            }
        }
        wait()
    }

    const connectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close()
        }

        const ws = new WebSocket('ws://localhost:8000/llm/ws/chat')
        wsRef.current = ws

        ws.onopen = () => {
            setIsConnected(true)
            console.log('[LLM] WebSocket 연결됨')
        }

        ws.onmessage = (event) => {
            const data = event.data
            // console.log('[WebSocket 수신]', data)

            if (data === '[DONE]') {
                console.log('[LLM] 스트리밍 종료됨')
                finalizeMessage()
                useLLMStore.getState().setStreaming(false)
                return
            }

            try {
                const parsed = JSON.parse(data)

                console.log('[📥 WebSocket 수신 데이터]', parsed)

                if (parsed && typeof parsed === 'object' && parsed.type === 'interaction_id') {
                    if (parsed?.toolCall?.integration) {
                        console.log('[🎧 toolCall 감지됨]', parsed.toolCall)
                        execute(parsed.toolCall)
                    }
                    
                    useLLMStore.setState((state) => {
                        const msgs = [...state.messages]
                        const last = [...msgs].reverse().find((m) => m.role === 'assistant' && !m.interactionId)

                        if (last) {
                            last.interactionId = parsed.id
                            last.translatedMessage = parsed.translated
                            last.jaTranslatedMessage = parsed.ja_translated
                            last.isFinal = true
                        } else {
                            console.warn('[❌ 마지막 메시지 못 찾음]', msgs)
                        }

                        return { messages: msgs }
                    })

                    useLLMStore.getState().updateEmotionTone(
                        parsed.id,
                        parsed.emotion ?? 'neutral',
                        parsed.tone ?? 'neutral',
                        parsed.blendshape ?? 'neutral'
                    )

                    sendExpression(parsed.blendshape ?? 'Neutral')
                    
                    const jaText = parsed.ja_translated
                    const autoSpeak = useLLMStore.getState().autoSpeakEnabled

                    if (jaText && autoSpeak) {
                        fetch('http://localhost:8000/tts/synthesize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: jaText }),
                        })
                        .then((res) => res.json())
                        .then(({ audioUrl }) => {
                            const audio = new Audio(audioUrl)
                            audio.play()
                        })
                        .catch((err) => console.error('[TTS 실패]', err))
                    }

                    useLLMStore.getState().setStreaming(false)
                    return
                }

                if (typeof parsed === 'number') {
                    useLLMStore.getState().addStreamingChunk('assistant', String(parsed))
                    return
                }

                if (typeof parsed === 'string') {
                    useLLMStore.getState().addStreamingChunk('assistant', parsed)
                    return
                }

                console.warn('[WebSocket] 처리되지 않은 데이터 형식', parsed)

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

                    state.setStreaming(true)
                }

                state.addStreamingChunk('assistant', data)
            }
        }

        ws.onclose = () => {
            setIsConnected(false)
            console.log('[LLM] WebSocket 종료됨')
            finalizeMessage()
            useLLMStore.getState().setStreaming(false)
        }

        ws.onerror = (err) => {
            setIsConnected(false)
            console.error('[LLM] WebSocket 오류', err)
        }
    }, [finalizeMessage])

    useEffect(() => {
        connectWebSocket()
        return () => {
            wsRef.current?.close()
        }
    }, [connectWebSocket])

    const send = (input: string) => {
        const modelId = useMCPStore.getState().activeModelId
        const config = useMCPStore.getState().getCurrentConfig()

        if (!modelId || !config?.enabled) {
            notify('활성화된 MCP 모델이 없습니다.', 'error')
            return
        }

        if (!config.model_key) {
            notify('모델 키가 설정되지 않았습니다.', 'error')
            return
        }

        const messages = useLLMStore.getState().messages
        const recentWindow = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-16)
            .map((m) => ({
                role: m.role,
                content: m.message,
            }))

        recentWindow.push({ role: 'user', content: input })

        const payload = {
            model_id: modelId,
            messages: recentWindow
        }

        console.log('[WebSocket 상태]', wsRef.current?.readyState)
        console.log('[보낼 메시지]', payload)

        waitForSocketConnection(() => {
            wsRef.current?.send(JSON.stringify(payload))
        })
    }

    const stop = () => {
        wsRef.current?.close()
    }

    const reconnect = () => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
            connectWebSocket()
            notify('WebSocket과 재연결 중입니다.', 'info')
        }
    }

    return { send, isConnected, reconnect, stop }
}
