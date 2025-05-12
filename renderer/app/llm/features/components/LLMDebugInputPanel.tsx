'use client'

import { useState } from 'react'
import { useLLMStream } from '@/app/llm/hooks/useLLMStream'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'
import { Send } from 'lucide-react'

export default function LLMDebugInputPanel() {
    const [input, setInput] = useState('')
    const { send } = useLLMStream()
    const { addMessage } = useLLMStore.getState()

    const handleSubmit = () => {
        if (!input.trim()) return
        addMessage({ role: 'user', message: input })
        send(input)
        setInput('')
    }

    return (
        <div className="mt-4 flex items-center gap-3 w-full bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-sm">
            <input
                type="text"
                className="flex-1 bg-transparent outline-none text-sm placeholder-white/50 text-white px-2"
                placeholder="LLM에게 보낼 입력을 테스트해보세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                }}
            />
            <button
                onClick={handleSubmit}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition text-white shadow"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
    )
}
