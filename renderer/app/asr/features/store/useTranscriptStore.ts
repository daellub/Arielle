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
    setTranscript: (text: string) => {
        const { lastRecognizedTranscript } = get();
        if (lastRecognizedTranscript) {
            set((state) => ({
                history: [...state.history, lastRecognizedTranscript],
                lastRecognizedTranscript: null, // history로 옮겼으면 초기화
            }));
        }
        set(() => ({
            currentTranscript: {
                text,
                lang: 'ko',
                timestamp: new Date().toLocaleTimeString(),
            }
        }))
    },
    finalizeTranscript: () => {
        const { currentTranscript } = get();
        if (currentTranscript) {
            set(() => ({
                lastRecognizedTranscript: currentTranscript,
            }))
        }
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