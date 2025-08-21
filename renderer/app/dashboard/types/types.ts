// app/dashboard/types/types.ts
export type ModuleKey = 'ASR' | 'TRANSLATE' | 'LLM' | 'TTS' | 'VRM' | 'DB' | 'BACKEND'

export type Health = Record<ModuleKey, { ok: boolean; msg?: string }>

export type LatencyPoint = {
    ts: number
    asr?: number
    translate?: number
    llm?: number
    tts?: number
    vrm?: number
    e2e?: number
}

export type ResourcePoint = {
    ts: number
    cpu?: number
    gpu?: number
    mem?: number
    npu?: number
    netIn?: number
    netOut?: number
}

export type LogType = 'INFO' | 'ERROR' | 'PROCESS' | 'RESULT'
export type LogEntry = { timestamp: string; type: LogType; source: string; message: string }