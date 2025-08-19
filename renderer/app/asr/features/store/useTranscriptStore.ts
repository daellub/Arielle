// app/asr/features/store/useTranscriptStore.ts
import { create } from 'zustand'

export interface Transcript {
    text: string
    lang: string
    timestamp: string
}

interface TranscriptStore {
    currentTranscript: Transcript | null
    lastRecognizedTranscript: Transcript | null
    history: Transcript[]
    setTranscript: (text: string) => void
    finalizeTranscript: () => void
    clearTranscript: () => void
    stopTranscript: () => void
}

export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
    currentTranscript: null,
    lastRecognizedTranscript: null,
    history: [],

    setTranscript: (text: string, lang: string = 'ko') => {
        set({
            currentTranscript: {
                text,
                lang,
                timestamp: new Date().toLocaleTimeString(),
            },
        })
    },

    finalizeTranscript: () => {
        const cur = get().currentTranscript
        if (!cur) return
        set((state) => ({
            lastRecognizedTranscript: cur,
            history: [...state.history, cur],
            currentTranscript: null,
        }))
    },

    clearTranscript: () => {
        set({
            currentTranscript: null,
            lastRecognizedTranscript: null,
            history: [],
        })
    },
    
    stopTranscript: () => {
        set({
            currentTranscript: null,
            lastRecognizedTranscript: null,
        })
    },
}))