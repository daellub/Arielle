// app/features/asr/store/useSystemStatusStore.ts
import { create } from 'zustand'

interface ModelInfo {
    name: string
    framework: string
    device: string
    language: string
    loaded: string
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

export const useSystemStatusStore = create<Store>((set) => ({
    status: {
        databaseActive: false,
        modelActive: false,
        modelInfo: null,
        hardwareInfo: null
    },
    setDatabaseStatus: (active) =>
        set((state) => ({
            status: { ...state.status, databaseActive: active },
        })),
    setModelStatus: (active) =>
        set((state) => ({
            status: { ...state.status, modelActive: active }
        })),
    setModelStatusAndInfo: (active, info) =>
        set((state) => ({
            status: {
                ...state.status,
                modelActive: active,
                modelInfo: info,
            },
        })),
    setHardwareInfo: (info) =>
        set((state) => ({
            status: { ...state.status, hardwareInfo: info }
        })),
}))