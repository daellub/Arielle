// app/asr/features/types/Model.ts
export type ModelStatus = 'active' | 'idle' | 'error' | 'loading'

export interface Model {
    id: string
    main: string
    type: string
    name: string
    language: string
    framework: string
    device: string
    latency: string
    latencyMs?: number
    logo: string
    status: ModelStatus
    loadedTime?: string
    loadedAtIso?: string

    // 로컬 모델 대비 확장성
    config?: Record<string, any>
}