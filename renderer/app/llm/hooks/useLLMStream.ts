// app/llm/hooks/useLLMStream.ts
import { useEffect, useRef } from 'react'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'

export function useLLMStream() {
    const wsRef = useRef<WebSocket | null>(null)
    const addMessage = useLLMStore((s) => s.addMessage)
    const addStreamingChunk = useLLMStore((s) => s.addStreamingChunk)
    const finalizeMessage = useLLMStore((s) => s.finalizeMessage)

    const send = (input: string) => {
        const payload = {
            messages: [{ role: 'user', content: input }]
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload))
        }
    }

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/llm/ws/chat')
        wsRef.current = ws

        ws.onopen = () => {
            console.log('[LLM] WebSocket 연결됨')
        }

        ws.onmessage = (event) => {
            const data = event.data

            try {
                const parsed = JSON.parse(data)
                if (parsed.type === 'interaction_id') {
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
                        parsed.tone ?? 'neutral'
                    )

                    return
                }
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

                state.addStreamingChunk('assistant', data)
            }
        }

        ws.onclose = () => {
            console.log('[LLM] WebSocket 종료됨')
            finalizeMessage()
        }

        ws.onerror = (err) => {
            console.error('[LLM] WebSocket 오류', err)
        }

        return () => {
            ws.close()
        }
    }, [])

    return { send }
}
