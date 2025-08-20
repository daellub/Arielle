// app/llm/features/store/useSecurityStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SecuritySettingsState {
    apiKeyRequired: boolean
    allowedOrigins: string
    rateLimit: number
    useJWT: boolean
    disableAuth: boolean

    updateSecuritySettings: (patch: Partial<SecuritySettingsState>) => void
    setAllowedOriginList: (list: string[]) => void
    getAllowedOriginList: () => string[]
    toggle: (key: 'apiKeyRequired' | 'useJWT' | 'disableAuth', v?: boolean) => void
    reset: () => void
}

const DEFAULTS: Omit<SecuritySettingsState, 'updateSecuritySettings' | 'setAllowedOriginList' | 'getAllowedOriginList' | 'toggle' | 'reset'> = {
    apiKeyRequired: false,
    allowedOrigins: '',
    rateLimit: 10,
    useJWT: false,
    disableAuth: false,
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
    const n = Math.floor(Number(v))
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

export const useSecurityStore = create<SecuritySettingsState>()(
    persist(
        (set, get) => ({
            ...DEFAULTS,

            updateSecuritySettings: (patch) =>
                set((state) => ({
                    apiKeyRequired:
                        patch.apiKeyRequired !== undefined ? !!patch.apiKeyRequired : state.apiKeyRequired,
                    allowedOrigins: patch.allowedOrigins ?? state.allowedOrigins,
                    rateLimit:
                        patch.rateLimit !== undefined
                            ? clampInt(patch.rateLimit, 0, 10000, state.rateLimit)
                            : state.rateLimit,
                    useJWT: patch.useJWT !== undefined ? !!patch.useJWT : state.useJWT,
                    disableAuth: patch.disableAuth !== undefined ? !!patch.disableAuth : state.disableAuth,
                })),

            setAllowedOriginList: (list) =>
                set({
                    allowedOrigins: list
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .join('\n'),
                }),

            getAllowedOriginList: () => {
                const raw = get().allowedOrigins ?? ''
                return raw
                    .split(/[\n,]/g)
                    .map((s) => s.trim())
                    .filter(Boolean)
            },

            toggle: (key, v) =>
                set((s) => ({
                    ...s,
                    [key]: v !== undefined ? !!v : !s[key],
                }) as SecuritySettingsState),

            reset: () => set({ ...DEFAULTS }),
        }),
        {
            name: 'security-settings',
            version: 1,
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                apiKeyRequired: s.apiKeyRequired,
                allowedOrigins: s.allowedOrigins,
                rateLimit: s.rateLimit,
                useJWT: s.useJWT,
                disableAuth: s.disableAuth,
            }),
        }
    )
)

export default useSecurityStore
