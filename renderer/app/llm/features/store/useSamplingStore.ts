// app/llm/features/store/useSamplingStore.ts
import { create } from 'zustand'

interface SamplingSettings {
    temperature: number
    topK: number
    topP: number
    repetitionPenalty: number
    updateSamplingSettings: (newSettings: Partial<SamplingSettings>) => void
}

const useSamplingStore = create<SamplingSettings>((set) => ({
    temperature: 1.0,
    topK: 40,
    topP: 0.9,
    repetitionPenalty: 1.1,
    updateSamplingSettings: (newSettings) => set((state) => ({ ...state, ...newSettings }))
}))

export default useSamplingStore