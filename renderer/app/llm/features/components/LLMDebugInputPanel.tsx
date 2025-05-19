// app/llm/features/components/LLMDebugInputPanel.tsx
'use client'

import { useState } from 'react'
import { useLLMStream } from '@/app/llm/hooks/useLLMStream'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'
import { Send, RefreshCw, Wifi, WifiOff, CircleStop } from 'lucide-react'

export default function LLMDebugInputPanel() {
    const [input, setInput] = useState('')
    const { send, isConnected, reconnect } = useLLMStream()
    const { addMessage } = useLLMStore.getState()
    const streaming = useLLMStore((s) => s.streaming)

    const handleSubmit = () => {
        if (!input.trim()) return
        addMessage({ role: 'user', message: input })
        send(input)
        setInput('')
    }

    return (
        <div className="mt-4 flex items-center gap-3 w-full bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-sm">
            <div className="flex items-center gap-2">
                {isConnected
                    ? (
                        <Wifi className="text-green-400 w-5 h-4">
                            <title>Connected</title>
                        </Wifi>
                    )
                    : (
                        <WifiOff className="text-red-400 w-5 h-4">
                            <title>Disconnected</title>
                        </WifiOff>
                    )
                }
                {!isConnected && (
                    <button
                        onClick={reconnect}
                        title="Reconnect"
                        className='p-1 rounded hover:bg-white/10 transition'
                    >
                        <RefreshCw className="w-4 h-4 text-white" />
                    </button>
                )}
            </div>
            
            <input
                type="text"
                className="flex-1 bg-transparent outline-none text-sm placeholder-white/50 text-white px-2"
                placeholder="LLM에게 보낼 입력을 입력해보세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                }}
            />
            <button
                onClick={streaming ? stop : handleSubmit}
                className={`p-2 rounded-lg transition text-white shadow
                    ${streaming ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
            >
                {streaming
                    ? <CircleStop className="w-4 h-4" />
                    : <Send className="w-4 h-4" />
                }
            </button>
        </div>
    )
}
