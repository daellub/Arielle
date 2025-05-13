// app/llm/features/store/llmSettingsStore.ts
import { create } from 'zustand'

interface LLMSettingsState {
    modelName: string
    maxTokens: number
    temperature: number
    topK: number
    topP: number
    repetitionPenalty: number
    responseTime: number
    device: string
    setSettings: (settings: Partial<LLMSettingsState>) => void
}

export const useLLMSettingsStore = create<LLMSettingsState>((set) => ({
    modelName: 'Arielle-Llama-3.1-8B-Q6',
    maxTokens: 512,
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    repetitionPenalty: 1.1,
    responseTime: 1.2,
    device: 'Intel Arc 140V GPU',
    setSettings: (settings) => set((state) => ({ ...state, ...settings })),
}))
