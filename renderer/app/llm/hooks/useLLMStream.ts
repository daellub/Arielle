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
                        const last = msgs[msgs.length - 1]
                        if (last?.role === 'assistant') {
                            last.interactionId = parsed.id
                            last.translatedMessage = parsed.translated
                        }
                        return { messages: msgs }
                    })
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
