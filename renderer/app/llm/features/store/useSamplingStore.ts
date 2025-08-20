// app/llm/features/store/useSamplingStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SamplingSettingsState {
    temperature: number
    topK: number
    topP: number
    repetitionPenalty: number

    updateSamplingSettings: (patch: Partial<SamplingSettingsState>) => void
    reset: () => void
}

const DEFAULTS: Omit<SamplingSettingsState, 'updateSamplingSettings' | 'reset'> = {
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    repetitionPenalty: 1.1,
}

function clamp(v: unknown, min: number, max: number, fallback: number) {
    const n = Number(v)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}
function clampInt(v: unknown, min: number, max: number, fallback: number) {
    const n = Math.round(Number(v))
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

export const useSamplingStore = create<SamplingSettingsState>()(
    persist(
        (set, get) => ({
            ...DEFAULTS,

            updateSamplingSettings: (patch) =>
                set((state) => ({
                    temperature:
                        patch.temperature !== undefined
                            ? clamp(patch.temperature, 0, 2, state.temperature)
                            : state.temperature,
                    topK:
                        patch.topK !== undefined
                            ? clampInt(patch.topK, 0, 2048, state.topK)
                            : state.topK,
                    topP:
                        patch.topP !== undefined
                            ? clamp(patch.topP, 0, 1, state.topP)
                            : state.topP,
                    repetitionPenalty:
                        patch.repetitionPenalty !== undefined
                            ? clamp(patch.repetitionPenalty, 0.5, 2.5, state.repetitionPenalty)
                            : state.repetitionPenalty,
                })),

            reset: () => set({ ...DEFAULTS }),
        }),
        {
            name: 'sampling-settings',
            version: 1,
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                temperature: s.temperature,
                topK: s.topK,
                topP: s.topP,
                repetitionPenalty: s.repetitionPenalty,
            }),
        }
    )
)

export default useSamplingStore
