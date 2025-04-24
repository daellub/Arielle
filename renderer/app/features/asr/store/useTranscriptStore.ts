// app/store/useTranscriptStore.ts
import { create } from 'zustand'

export interface Transcript {
    text: string
    lang: string
    timestamp: string
}

interface TranscriptStore {
    currentTranscript: Transcript | null
    history: Transcript[]
    setTranscript: (transcript: Transcript) => void
    clearTranscript: () => void
    stopTranscript: () => void
}

export const useTranscriptStore = create<TranscriptStore>((set) => ({
    currentTranscript: null,
    history: [],
    setTranscript: (transcript) => {
        set((state) => ({
            currentTranscript: transcript,
            history: [...state.history, transcript],
        }))
    },
    clearTranscript: () => {
        set({
            currentTranscript: null,
            history: [],
        })
    },
    stopTranscript: () => {
        set((state) => ({
            currentTranscript: null,
        }))
    },
}))