// app/dashboard/api.ts
import axios from 'axios'
import type { Health, ModuleKey, LatencyPoint, ResourcePoint, LogEntry } from './types/types'

export const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
export const MCP = process.env.NEXT_PUBLIC_MCP_BASE_URL ?? 'http://localhost:8500'

export async function getSummary(): Promise<{ errorRate: number; sessions: number; throughput: number }> {
    const { data } = await axios.get(`${BACKEND}/metrics/summary`)
    return {
        errorRate: data?.errorRate ?? 0,
        sessions: data?.sessions ?? 0,
        throughput: data?.throughput ?? 0,
    }
}

export async function getHealth(): Promise<Health> {
    const endpoints: Record<ModuleKey, string> = {
        ASR: `${BACKEND}/health/asr`,
        TRANSLATE: `${BACKEND}/health/translate`,
        LLM: `${BACKEND}/health/llm`,
        TTS: `${BACKEND}/health/tts`,
        VRM: `${BACKEND}/health/vrm`,
        DB: `${BACKEND}/health/db`,
        BACKEND: `${BACKEND}/health`,
    }
    const entries = await Promise.all(
        (Object.keys(endpoints) as ModuleKey[]).map(async (k) => {
            try {
                const { data } = await axios.get(endpoints[k], { timeout: 3000 })
                return [k, { ok: !!data?.ok, msg: data?.msg ?? '' }] as const
            } catch (e: any) {
                return [k, { ok: false, msg: e?.message ?? 'unreachable' }] as const
            }
        })
    )
    const result = {} as Health
    entries.forEach(([k, v]) => (result[k] = v))
    return result
}

export async function getLatency(): Promise<LatencyPoint[]> {
    const { data } = await axios.get(`${BACKEND}/metrics/latency`)
    return Array.isArray(data) ? data : []
}

export async function getResources(): Promise<ResourcePoint[]> {
    const { data } = await axios.get(`${BACKEND}/metrics/system`)
    return Array.isArray(data) ? data : []
}

export async function getLogs(limit = 100): Promise<LogEntry[]> {
    const { data } = await axios.get(`${MCP}/mcp/api/logs`, { params: { limit } })
    return Array.isArray(data) ? data : []
}

export async function restartModule(module: Exclude<ModuleKey, 'DB' | 'BACKEND'>) {
    await axios.post(`${BACKEND}/control/restart`, { module })
}

export async function switchPreset(preset: 'Balanced' | 'Creative' | 'Precise') {
    await axios.patch(`${MCP}/mcp/llm/preset`, { preset })
}

export async function flushCaches() {
    await axios.post(`${BACKEND}/control/flush`)
}