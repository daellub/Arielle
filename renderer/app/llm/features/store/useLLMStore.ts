// app/llm/features/store/useLLMStore.ts
import { createWithEqualityFn } from 'zustand/traditional';
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
    blendshape?: string
    modelId?: string
}

export interface LLMChatStore {
    messages: LLMChatMessage[]
    live: LLMChatMessage | null

    streaming: boolean
    autoSpeakEnabled: boolean

    idxByInteraction: Record<number, number>

    setAutoSpeakEnabled: (v: boolean) => void
    setStreaming: (v: boolean) => void

    addMessage: (msg: LLMChatMessage) => void

    addStreamingChunk: (role: Role, chunk: string) => void

    finalizeMessage: () => void

    updateEmotionTone: (interactionId: number, emotion: string, tone: string, blendshape: string) => void
    
    resetMessages: () => void

    setFeedbackByIndex: (index: number, rating: 'up' | 'down') => void
}

export const useLLMStore = createWithEqualityFn<LLMChatStore>()(
    subscribeWithSelector<LLMChatStore>((set, get) => ({
        messages: [],
        live: null,

        streaming: false,
        autoSpeakEnabled: false,

        idxByInteraction: {},

        setAutoSpeakEnabled: (v) => set({ autoSpeakEnabled: v }),
        setStreaming: (v) => set({ streaming: v }),

        addMessage: (msg) => 
            set((state) => {
                const next = [...state.messages, msg]
                const map = { ...state.idxByInteraction }
                if (typeof msg.interactionId === 'number') {
                    map[msg.interactionId] = next.length - 1
                }
                return { messages: next, idxByInteraction: map }
            }),

        addStreamingChunk: (role, chunk) => {
            set((state) => {
                if (state.live && state.live.role === role) {
                    return {
                        live: { ...state.live, message: state.live.message + chunk },
                        streaming: true,
                    }
                }

                return {
                    live: { role, message: chunk, isFinal: false },
                    streaming: true,
                }
            })
        },
        
        finalizeMessage: () =>
            set((state) => {
                if (state.live) {
                    const finalized: LLMChatMessage = { ...state.live, isFinal: true }
                    const next = [...state.messages, finalized]
                    const map = { ...state.idxByInteraction }
                    if (typeof finalized.interactionId === 'number') {
                        map[finalized.interactionId] = next.length - 1
                    }
                    return { messages: next, live: null, streaming: false, idxByInteraction: map }
                }

                const msgs = state.messages
                if (msgs.length > 0) {
                    const last = msgs[msgs.length - 1]
                    if (last.role === 'assistant' && !last.isFinal) {
                        const updated = [...msgs]
                        updated[updated.length - 1] = { ...last, isFinal: true }
                        return { messages: updated, streaming: false }
                    }
                }
                return { streaming: false }
            }),

        updateEmotionTone: (interactionId, emotion, tone, blendshape) =>
            set((state) => {
                let messages: LLMChatMessage[] | undefined
                const idx = state.idxByInteraction[interactionId]

                let live = state.live
                if (live?.interactionId === interactionId) {
                    live = { ...live, emotion, tone, blendshape }
                }

                if (typeof idx === 'number') {
                    const target = state.messages[idx]
                    if (target) {
                        messages = [...state.messages]
                        messages[idx] = { ...target, emotion, tone, blendshape }
                    }
                }

                return {
                    live,
                    messages: messages ?? state.messages,
                }
            }),

        resetMessages: () => set({ messages: [], live: null, idxByInteraction: {}, streaming: false }),
    
        setFeedbackByIndex: (index, rating) =>
            set((state) => {
                const list = state.messages
                if (!list[index] || list[index].feedback) return {}
                const updated = [...list]
                updated[index] = { ...updated[index], feedback: rating }
                return { messages: updated }
            }),
    }))
)