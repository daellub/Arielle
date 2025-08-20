// app/lib/api/mcp.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const MCP_BASE = (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'

export const mcpHttp = axios.create({
    baseURL: `${MCP_BASE}/mcp`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

export type ApiResult<T> =
    | { ok: true; status: number; data: T}
    | { ok: false; status?: number; error: string }

async function request<T>(p: Promise<any>): Promise<ApiResult<T>> {
    try {
        const { data, status } = await p
        return { ok: true, status, data }
    } catch (e) {
        const err = e as AxiosError<any>
        const status = err.response?.status
        const msg =
            (err.response?.data && (err.response.data.message || err.response.data.error)) ||
            err.message ||
            'Unknown error'
        return { ok: false, status, error: String(msg) }
    }
}

export interface ReqOpts {
    signal?: AbortSignal
    config?: AxiosRequestConfig
}

export interface ServerEntry {
    alias: string
    url?: string
    enabled?: boolean
    meta?: Record<string, any>
    [k: string]: any
}

export interface ServerStatus {
    online?: boolean
    lastHeartbeat?: string
    version?: string
    [k: string]: any
}

export interface ModelIntegrations {
    integrations: string[]
}

export const listServers = (opts?: ReqOpts) =>
    request<ServerEntry[]>(
        mcpHttp.get('/servers', { signal: opts?.signal, ...(opts?.config || {}) })
    )

export const createServer = (srv: Partial<ServerEntry>, opts?: ReqOpts) =>
    request<ServerEntry>(
        mcpHttp.post('/servers', srv, { signal: opts?.signal, ...(opts?.config || {}) })
    )

export const updateServer = (alias: string, patch: Partial<ServerEntry>, opts?: ReqOpts) =>
    request<ServerEntry>(
        mcpHttp.patch(`/servers/${encodeURIComponent(alias)}`, patch, {
            signal: opts?.signal,
            ...(opts?.config || {}),
        })
    )

export const deleteServer = (alias: string, opts?: ReqOpts) =>
    request<null>(
        mcpHttp.delete(`/servers/${encodeURIComponent(alias)}`, {
            signal: opts?.signal,
            ...(opts?.config || {}),
        })
    )

export const getServerStatus = (alias: string, opts?: ReqOpts) =>
    request<ServerStatus>(
        mcpHttp.get(`/servers/${encodeURIComponent(alias)}/status`, {
            signal: opts?.signal,
            ...(opts?.config || {}),
        })
    )

export const getModelIntegrations = (modelId: string, opts?: ReqOpts) =>
    request<ModelIntegrations>(
        mcpHttp.get(`/llm/model/${encodeURIComponent(modelId)}/integrations`, {
            signal: opts?.signal,
            ...(opts?.config || {}),
        })
    )