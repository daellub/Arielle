// app/llm/features/store/useLLMStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type Role = 'user' | 'assistant'

export interface LLMChatMessage {
    role: 'user' | 'assistant'
    message: string
    name?: string
    interactionId?: number
    isFinal?: boolean
    feedback?: 'up' | 'down'
    translatedMessage?: string
    jaTranslatedMessage?: string
    emotion?: string
    tone?: string
}

interface LLMChatStore {
    messages: LLMChatMessage[]
    addMessage: (msg: LLMChatMessage) => void
    addStreamingChunk: (role: Role, chunk: string) => void
    finalizeMessage: () => void
    updateEmotionTone: (interactionId: number, emotion: string, tone: string) => void
    resetMessages: () => void
}

export const useLLMStore = create<LLMChatStore>()(
    subscribeWithSelector((set) => ({
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

        updateEmotionTone: (interactionId, emotion, tone) =>
            set((state) => {
                const updated = state.messages.map((msg) => {
                    if (msg.interactionId === interactionId) {
                        const newMsg = { ...msg, emotion, tone }
                        return newMsg
                    }
                    return msg
                })
                return { messages: updated }
            }),

        resetMessages: () => set({ messages: [] })
    }))
)