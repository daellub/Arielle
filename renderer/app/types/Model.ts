// app/types/Model.ts
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
    logo: string
    status: ModelStatus
    loadedTime?: string
}