// app/llm/features/store/useLLMStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type Role = 'user' | 'assistant'

export interface LLMChatMessage {
    role: 'user' | 'assistant' | 'system'
    message: string
    name?: string
    interactionId?: number
    isFinal?: boolean
    feedback?: 'up' | 'down'
    translatedMessage?: string
    jaTranslatedMessage?: string
    emotion?: string
    tone?: string
    modelId?: string
}

interface LLMChatStore {
    messages: LLMChatMessage[]
    streaming: boolean
    setStreaming: (v: boolean) => void

    addMessage: (msg: LLMChatMessage) => void
    addStreamingChunk: (role: Role, chunk: string) => void
    finalizeMessage: () => void
    updateEmotionTone: (interactionId: number, emotion: string, tone: string) => void
    resetMessages: () => void
}

export const useLLMStore = create<LLMChatStore>()(
    subscribeWithSelector<LLMChatStore>((set) => ({
        messages: [],
        streaming: false,

        setStreaming: (v) => set({ streaming: v }),

        addMessage: (msg) => 
            set((state) => ({ messages: [...state.messages, msg] })),

        addStreamingChunk: (role, chunk) => {
            set((state) => {
                const last = state.messages[state.messages.length - 1]
                if (last && last.role === role) {
                    const newMessage = last.message + chunk
                    // console.log('[StreamChunk APPEND]', { old: last.message, chunk, newMessage })
                    const updatedMessages = [...state.messages]
                    updatedMessages[updatedMessages.length - 1] = {
                        ...last,
                        message: newMessage
                    }
                    return { messages: updatedMessages}
                } else {
                    console.log('[StreamChunk NEW]', { role, chunk })
                    return { messages: [...state.messages, { role, message: chunk }] }
                }
            })
        },
        
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