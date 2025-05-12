// app/llm/services/llmApi.ts

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export async function chatLLM(
    messages: ChatMessage[]
): Promise<string> {
    const res = await fetch('http://127.0.0.1:8000/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`LLM 에러: ${text}`)
    }
    const { content } = await res.json()
    return content
}
