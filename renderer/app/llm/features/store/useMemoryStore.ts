// app/llm/features/store/useMemoryStore.ts
import { create } from 'zustand'

export interface MemoryPrompt {
    id: number
    content: string
    enabled: boolean
}

interface MemorySettings {
    memoryStrategy: string
    maxTokens: number
    includeHistory: boolean
    saveMemory: boolean
    contextPrompts: MemoryPrompt[]
    updateMemorySettings: (newSettings: Partial<Omit<MemorySettings, 'updateMemorySettings'>>) => void
}

const useMemoryStore = create<MemorySettings>((set) => ({
    memoryStrategy: 'Hybrid',
    maxTokens: 2048,
    includeHistory: true,
    saveMemory: true,
    contextPrompts: [],
    updateMemorySettings: (newSettings) =>
        set((state) => ({
            ...state,
            ...newSettings,
        })),
}))

export default useMemoryStore