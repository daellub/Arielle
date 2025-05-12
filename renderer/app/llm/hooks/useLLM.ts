// app/llm/hooks/useLLM.ts
import { useState, useCallback } from 'react'
import { chatLLM, ChatMessage } from '@/app/llm/services/llmApi'

export function useLLM() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const send = useCallback(async (userText: string) => {
        const userMsg: ChatMessage = { role: 'user', content: userText }
        const updated = [...messages, userMsg]
        setMessages(updated)
        setLoading(true)
        setError(null)

        try {
            const reply = await chatLLM(updated)
            const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
            setMessages(msgs => [...msgs, assistantMsg])
            return reply
        } catch (e: any) {
            setError(e.message)
            throw e
        } finally {
            setLoading(false)
        }
    }, [messages])

    return { messages, loading, error, send }
}
