// app/llm/features/store/useMCPStore.ts
import { create } from 'zustand'

type Strategy = 'None' | 'Window' | 'Summary' | 'Hybrid'

interface MemoryPrompt {
    id: number
    content: string
    enabled: boolean
}

interface MCPConfig {
    name?: string
    integrations: string[]
    local_sources: number[]
    remote_sources: number[]
    prompt: string
    linkedPromptIds: number[]
    setLinkedPromptIds: (ids: number[]) => void
    linkedToolIds: number[]
    setLinkedToolIds: (ids: number[]) => void
    memory: {
        strategy: Strategy
        maxTokens: number
        includeHistory: boolean
        saveMemory: boolean
        contextPrompts: MemoryPrompt[]
    }
    sampling: {
        temperature: number
        topK: number
        topP: number
        repetitionPenalty: number
    }
    tools: {
        name: string
        type: string
        command: string
        enabled: boolean
    }[]
}

interface MCPStore {
    configMap: { [modelId: string]: MCPConfig }
    activeModelId: string | null
    setActiveModel: (modelId: string) => void
    updateConfig: (modelId: string, update: Partial<MCPConfig>) => void
    getCurrentConfig: () => MCPConfig | null
}

export const useMCPStore = create<MCPStore>((set, get) => ({
    configMap: {},
    activeModelId: null,
    setActiveModel: (modelId) => set({ activeModelId: modelId }),
    updateConfig: (modelId, update) => set((state) => {
        const existing = state.configMap[modelId] || {}
        return {
            configMap: {
                ...state.configMap,
                [modelId]: {
                    ...existing,
                    ...update
                }
            }
        }
    }),
    getCurrentConfig: () => {
        const id = get().activeModelId
        return id ? get().configMap[id] || null : null
    }
}))
