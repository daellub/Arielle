// app/llm/features/store/useMemoryStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type MemoryStrategy = 'None' | 'Window' | 'Summary' | 'Hybrid'

export interface MemoryPrompt {
    id: number
    content: string
    enabled: boolean
}

interface MemorySettingsState {
    memoryStrategy: MemoryStrategy
    maxTokens: number
    includeHistory: boolean
    saveMemory: boolean
    contextPrompts: MemoryPrompt[]

    updateMemorySettings: (patch: Partial<Omit<MemorySettingsState, 'updateMemorySettings' | 'addPrompt' | 'updatePrompt' | 'togglePrompt' | 'removePrompt' | 'setPrompts' | 'reset'>>) => void

    setPrompts: (list: MemoryPrompt[]) => void
    addPrompt: (p: Omit<MemoryPrompt, 'id'> & { id?: number }) => number
    updatePrompt: (id: number, patch: Partial<Omit<MemoryPrompt, 'id'>>) => void
    togglePrompt: (id: number, enabled?: boolean) => void
    removePrompt: (id: number) => void

    reset: () => void
}

const DEFAULTS: Omit<MemorySettingsState, 'updateMemorySettings' | 'addPrompt' | 'updatePrompt' | 'togglePrompt' | 'removePrompt' | 'setPrompts' | 'reset'> = {
    memoryStrategy: 'Hybrid',
    maxTokens: 2048,
    includeHistory: true,
    saveMemory: true,
    contextPrompts: [],
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
    const n = Math.floor(Number(v))
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

export const useMemoryStore = create<MemorySettingsState>()(
    persist(
        (set, get) => ({
            ...DEFAULTS,

            updateMemorySettings: (patch) =>
                set((state) => {
                    const next = { ...state }
                    if (patch.memoryStrategy) next.memoryStrategy = patch.memoryStrategy
                    if (patch.maxTokens !== undefined) {
                        next.maxTokens = clampInt(patch.maxTokens, 128, 131072, state.maxTokens)
                    }
                    if (patch.includeHistory !== undefined) next.includeHistory = !!patch.includeHistory
                    if (patch.saveMemory !== undefined) next.saveMemory = !!patch.saveMemory
                    if (patch.contextPrompts) next.contextPrompts = [...patch.contextPrompts]
                    return next
                }),

            setPrompts: (list) => set({ contextPrompts: [...list] }),

            addPrompt: (p) => {
                const id = p.id ?? Date.now()
                const item: MemoryPrompt = { id, content: p.content, enabled: !!p.enabled }
                set((s) => ({ contextPrompts: [item, ...s.contextPrompts] }))
                return id
            },

            updatePrompt: (id, patch) =>
                set((s) => ({
                    contextPrompts: s.contextPrompts.map((it) =>
                        it.id === id ? { ...it, ...patch } : it
                    ),
                })),

            togglePrompt: (id, enabled) =>
                set((s) => ({
                    contextPrompts: s.contextPrompts.map((it) =>
                        it.id === id ? { ...it, enabled: enabled ?? !it.enabled } : it
                    ),
                })),

            removePrompt: (id) =>
                set((s) => ({ contextPrompts: s.contextPrompts.filter((it) => it.id !== id) })),

            reset: () => set({ ...DEFAULTS }),
        }),
        {
            name: 'memory-settings',
            version: 1,
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                memoryStrategy: s.memoryStrategy,
                maxTokens: s.maxTokens,
                includeHistory: s.includeHistory,
                saveMemory: s.saveMemory,
                contextPrompts: s.contextPrompts,
            }),
        }
    )
)

export default useMemoryStore