// app/llm/features/store/useSecurityStore.ts
import { create } from 'zustand'

interface SecuritySettings {
    apiKeyRequired: boolean
    allowedOrigins: string
    rateLimit: number
    useJWT: boolean
    disableAuth: boolean
    updateSecuritySettings: (s: Partial<SecuritySettings>) => void
}

const useSecurityStore = create<SecuritySettings>((set) => ({
    apiKeyRequired: false,
    allowedOrigins: '',
    rateLimit: 10,
    useJWT: false,
    disableAuth: false,
    updateSecuritySettings: (newSettings) => set((state) => ({ ...state, ...newSettings }))
}))

export default useSecurityStore