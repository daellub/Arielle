// app/dashboard/types/trace.ts
export type StageName = 'ASR' | 'TRANSLATE' | 'LLM' | 'TTS' | 'VRM'

export interface TraceStage {
    name: StageName
    startMs: number
    endMs: number
    ok: boolean
}

export interface TraceItem {
    id: string
    startedAt: number
    stages: TraceStage[]
    ok: boolean
}
