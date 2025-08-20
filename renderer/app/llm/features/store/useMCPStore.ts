// app/llm/features/store/useMCPStore.ts
import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

type Strategy = 'None' | 'Window' | 'Summary' | 'Hybrid'

interface MemoryPrompt {
    id: number
    content: string
    enabled: boolean
}

export interface ToolConfig {
    name: string
    type: string
    command: string
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
    linkedToolIds: number[]
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
    tools: ToolConfig[]
}

export interface MCPStore {
    configMap: Record<string, MCPConfig>
    activeModelId: string | null

    setActiveModel: (modelId: string) => void
    getCurrentConfig: () => MCPConfig | null

    upsertConfig: (modelId: string, next: Partial<MCPConfig>) => void
    updateCurrent: (next: Partial<MCPConfig>) => void

    updateConfig: (modelId: string, next: Partial<MCPConfig>) => void

    updateMemory: (next: Partial<MCPConfig['memory']>) => void
    updateSampling: (next: Partial<MCPConfig['sampling']>) => void
    setLinkedPromptIds: (ids: number[]) => void
    setLinkedToolIds: (ids: number[]) => void

    toggleTool: (name: string, enabled: boolean) => void
    setToolList: (tools: ToolConfig[]) => void
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
        linkedToolIds: [],
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

function mergeConfig(base: MCPConfig, patch: Partial<MCPConfig>): MCPConfig {
    return {
        ...base,
        ...patch,
        memory: patch.memory ? { ...base.memory, ...patch.memory } : base.memory,
        sampling: patch.sampling ? { ...base.sampling, ...patch.sampling } : base.sampling,
        tools: patch.tools ?? base.tools,
        linkedPromptIds: patch.linkedPromptIds ?? base.linkedPromptIds,
        linkedToolIds: patch.linkedToolIds ?? base.linkedToolIds,
        integrations: patch.integrations ?? base.integrations,
        local_sources: patch.local_sources ?? base.local_sources,
        remote_sources: patch.remote_sources ?? base.remote_sources,
    }
}

export const useMCPStore = create<MCPStore>((set, get) => ({
    configMap: {},
    activeModelId: null,

    setActiveModel: (modelId) =>
        set((state) => {
            if (!state.configMap[modelId]) {
                return {
                    activeModelId: modelId,
                    configMap: {
                        ...state.configMap,
                        [modelId]: createDefaultConfig()
                    },
                }
            }
            return { activeModelId: modelId }
        }),

    getCurrentConfig: () => {
        const id = get().activeModelId
        return id ? get().configMap[id] || null : null
    },

    upsertConfig: (modelId, next) =>
        set((state) => {
            const prev = state.configMap[modelId] ?? createDefaultConfig()
            const merged = mergeConfig(prev, next)
            if (prev === merged) return state
            return { configMap: { ...state.configMap, [modelId]: merged } }
        }),

    updateConfig: (modelId, patch) => set((s) => {
        const prev = s.configMap[modelId] ?? createDefaultConfig()
        const next = mergeConfig(prev, patch)
        return { configMap: { ...s.configMap, [modelId]: next } }
    }),

    updateCurrent: (next) => {
        const id = get().activeModelId
        if (!id) return
        get().upsertConfig(id, next)
    },

    updateMemory: (next) => {
        const id = get().activeModelId
        if (!id) return
        set((state) => {
            const prev = state.configMap[id] ?? createDefaultConfig()
            const merged = { ...prev, memory: { ...prev.memory, ...next } }
            return { configMap: { ...state.configMap, [id]: merged } }
        })
    },

    updateSampling: (next) => {
        const id = get().activeModelId
        if (!id) return
        set((state) => {
            const prev = state.configMap[id] ?? createDefaultConfig()
            const merged = { ...prev, sampling: { ...prev.sampling, ...next } }
            return { configMap: { ...state.configMap, [id]: merged } }
        })
    },

    setLinkedPromptIds: (ids) => {
        const id = get().activeModelId
        if (!id) return
        set((state) => {
            const prev = state.configMap[id] ?? createDefaultConfig()
            if (shallow(prev.linkedPromptIds, ids)) return state
            return {
                configMap: {
                    ...state.configMap,
                    [id]: { ...prev, linkedPromptIds: [...ids] },
                },
            }
        })
    },

    setLinkedToolIds: (ids) => {
        const id = get().activeModelId
        if (!id) return
        set((state) => {
            const prev = state.configMap[id] ?? createDefaultConfig()
            if (shallow(prev.linkedToolIds, ids)) return state
            return {
                configMap: {
                    ...state.configMap,
                    [id]: { ...prev, linkedToolIds: [...ids] },
                },
            }
        })
    },

    toggleTool: (name, enabled) => {
        const id = get().activeModelId
        if (!id) return
        set((state) => {
            const prev = state.configMap[id] ?? createDefaultConfig()
            const tools = prev.tools.map((t) => (t.name === name ? { ...t, enabled } : t))
            return { configMap: { ...state.configMap, [id]: { ...prev, tools } } }
        })
    },

    setToolList: (tools) => {
        const id = get().activeModelId
        if (!id) return
        set((state) => {
            const prev = state.configMap[id] ?? createDefaultConfig()
            return { configMap: { ...state.configMap, [id]: { ...prev, tools } } }
        })
    },
}))

export function useCurrentConfig<T>(
    selector: (cfg: MCPConfig | null) => T
) {
    return useMCPStore(
        (s) => {
            const id = s.activeModelId
            const cfg = id ? s.configMap[id] ?? null : null
            return selector(cfg)
        }
    )
}