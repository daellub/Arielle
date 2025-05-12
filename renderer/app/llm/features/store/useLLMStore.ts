// app/llm/features/store/useLLMStore.ts
import { create } from 'zustand'

type Role = 'user' | 'assistant'

interface LLMChatMessage {
    role: 'user' | 'assistant'
    message: string
    name?: string
    interactionId?: number
    isFinal?: boolean
    feedback?: 'up' | 'down'
}

interface LLMChatStore {
    messages: LLMChatMessage[]
    addMessage: (msg: LLMChatMessage) => void
    addStreamingChunk: (role: Role, chunk: string) => void
    finalizeMessage: () => void
    resetMessages: () => void
}

export const useLLMStore = create<LLMChatStore>((set) => ({
    messages: [],

    addMessage: (msg) => 
        set((state) => ({ messages: [...state.messages, msg] })),

    addStreamingChunk: (role, chunk) =>
        set((state) => {
            const last = state.messages[state.messages.length - 1]
            if (last && last.role === role) {
                last.message += chunk
                return { messages: [...state.messages] }
            } else {
                return { messages: [...state.messages, { role, message: chunk }] }
            }
        }),
    
    finalizeMessage: () =>
        set((state) => {
            const msgs = [...state.messages]
            const last = msgs[msgs.length - 1]
            if (last?.role === 'assistant') {
                last.isFinal = true
            }
            return { messages: msgs }
        }),

    resetMessages: () => set({ messages: [] })
}))