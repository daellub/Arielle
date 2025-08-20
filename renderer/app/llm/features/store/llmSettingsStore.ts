// app/llm/features/store/llmSettingsStore.ts
import { create } from 'zustand'

interface LLMSettingsState {
    responseTime: number
    device: string
    set: (patch: Partial<LLMSettingsState>) => void
}

export const useLLMSettingsStore = create<LLMSettingsState>((set) => ({
    responseTime: 1.2,
    device: 'Intel Arc 140V GPU',
    set: (patch) => set((state) => ({ ...state, ...patch })),
}))