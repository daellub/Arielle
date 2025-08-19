// app/asr/features/store/useSystemStatusStore.ts
import { create } from 'zustand'

interface ModelInfo {
    name: string
    framework: string
    device: string
    language: string
    loaded: boolean
    created_at: string
}

interface HardwareInfo {
    cpu: string
    cpu_usage: string
    ram: {
        total: string
        used_percent: string
    }
    disk: {
        total: string
        used_percent: string
    }
}

interface SystemStatus {
    databaseActive: boolean
    modelActive: boolean
    modelInfo: ModelInfo | null
    hardwareInfo: HardwareInfo | null
}

interface Store {
    status: SystemStatus,
    setDatabaseStatus: (active: boolean) => void
    setModelStatus: (active: boolean) => void
    setModelStatusAndInfo: (active: boolean, info: ModelInfo | null) => void
    setHardwareInfo: (info: HardwareInfo | null) => void
}

// 동일 값일 때 업데이트 중지
export const useSystemStatusStore = create<Store>((set, get) => ({
    status: {
        databaseActive: false,
        modelActive: false,
        modelInfo: null,
        hardwareInfo: null
    },
    setDatabaseStatus: (active) =>
        set((state) => state.status.databaseActive === active
            ? state
            : { status: { ...state.status, databaseActive: active } }),
    setModelStatus: (active) =>
        set((state) => state.status.modelActive === active
            ? state
            : { status: { ...state.status, modelActive: active } }),
    setModelStatusAndInfo: (active, info) =>
        set((state) => {
            const prev = state.status
            const sameActive = prev.modelActive === active
            const sameInfo = JSON.stringify(prev.modelInfo) === JSON.stringify(info)
            if (sameActive && sameInfo) return state
            return { status: { ...prev, modelActive: active, modelInfo: info } }
        }),
    setHardwareInfo: (info) =>
        set((state) => {
            const same = JSON.stringify(state.status.hardwareInfo) === JSON.stringify(info)
            return same ? state : { status: { ...state.status, hardwareInfo: info } }
        }),
}))