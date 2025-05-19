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
    model_key?: string
    enabled: boolean
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

function createDefaultConfig(): MCPConfig {
    return {
        name: '',
        model_key: '',
        enabled: false,
        integrations: [],
        local_sources: [],
        remote_sources: [],
        prompt: '',
        linkedPromptIds: [],
        setLinkedPromptIds: () => {},
        linkedToolIds: [],
        setLinkedToolIds: () => {},
        memory: {
            strategy: 'Window',
            maxTokens: 2048,
            includeHistory: true,
            saveMemory: true,
            contextPrompts: [],
        },
        sampling: {
            temperature: 0.7,
            topK: 40,
            topP: 0.9,
            repetitionPenalty: 1.2,
        },
        tools: [],
    }
}

export const useMCPStore = create<MCPStore>((set, get) => ({
    configMap: {},
    activeModelId: null,
    setActiveModel: (modelId) => set({ activeModelId: modelId }),
    updateConfig: (modelId, update) => set((state) => {
        const existing = state.configMap[modelId] || createDefaultConfig()
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
