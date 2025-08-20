// app/llm/services/toolsAPI.ts
import axios, {AxiosError} from 'axios'

export interface Tool {
    id: number
    name: string
    type: string
    command: string
    enabled: boolean
    [key: string]: any
}

export type Result<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: string; status?: number }

const MCP_BASE = (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'
const api = axios.create({
    baseURL: `${MCP_BASE}/mcp/api/tools`,
    timeout: 10000,
})

async function request<T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    body?: any,
    opts?: { signal?: AbortSignal }
): Promise<Result<T>> {
    try {
        const res = await api.request<T>({ method, url, data: body, signal: opts?.signal })
        return { ok: true, data: res.data, status: res.status }
    } catch (e) {
        const err = e as AxiosError<any>
        const status = err.response?.status
        const msg =
            err.response?.data?.message ??
            err.message ??
            '요청 처리 중 오류가 발생했습니다.'
        return { ok: false, error: msg, status }
    }
}

// TTL
let toolsCache: { at: number; data: Tool[] } | null = null
const CACHE_TTL_MS = 15_000

export async function fetchTools(opts?: { force?: boolean; signal?: AbortSignal }): Promise<Result<Tool[]>> {
    if (!opts?.force && toolsCache && Date.now() - toolsCache.at < CACHE_TTL_MS) {
        return { ok: true, data: toolsCache.data, status: 200 }
    }
    const res = await request<Tool[]>('get', '/', undefined, opts)
    if (res.ok) toolsCache = { at: Date.now(), data: res.data }
    return res
}

export async function createTool(tool: Partial<Tool>, opts?: { signal?: AbortSignal }): Promise<Result<Tool>> {
    const res = await request<Tool>('post', '/', tool, opts)
    if (res.ok && toolsCache) {
        toolsCache = { at: Date.now(), data: [res.data, ...toolsCache.data] }
    }
    return res
}

export async function updateTool(id: number, patch: Partial<Tool>, opts?: { signal?: AbortSignal }): Promise<Result<Tool>> {
    const res = await request<Tool>('patch', `/${id}`, patch, opts)
    if (res.ok && toolsCache) {
        toolsCache = {
            at: Date.now(),
            data: toolsCache.data.map(t => (t.id === id ? { ...t, ...res.data } : t)),
        }
    }
    return res
}

export async function deleteTool(id: number, opts?: { signal?: AbortSignal }): Promise<Result<void>> {
    const res = await request<void>('delete', `/${id}`, undefined, opts)
    if (res.ok && toolsCache) {
        toolsCache = { at: Date.now(), data: toolsCache.data.filter(t => t.id !== id) }
    }
    return res
}

export async function toggleToolEnabled(id: number, enabled: boolean, opts?: { signal?: AbortSignal }) {
    return updateTool(id, { enabled }, opts)
}