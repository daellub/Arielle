// app/llm/hooks/useMCPSource.ts
import axios, { AxiosError } from 'axios'

export interface SourceCommon {
    id: number
    name: string
    enabled: boolean
    [key: string]: any
}
export type LocalSource = SourceCommon & { kind: 'local' }
export type RemoteSource = SourceCommon & { kind: 'remote' }

export type Result<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: string; status?: number }

const MCP_BASE =
    (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ?? 'http://localhost:8500'

const api = axios.create({
    baseURL: `${MCP_BASE}/mcp/api`,
    timeout: 10000,
})

async function request<T>(
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    body?: any,
    opts?: { signal?: AbortSignal }
): Promise<Result<T>> {
    try {
        const res = await api.request<T>({
            method,
            url,
            data: body,
            signal: opts?.signal,
        })
        return { ok: true, data: res.data, status: res.status }
    } catch (e) {
        const err = e as AxiosError<any>
        const status = err.response?.status
        const msg =
            err.response?.data?.message ??
            err.message ??
            '요청 처리 중 문제가 발생하였습니다.'
        return { ok: false, error: msg, status }
    }
}

function makeSourceClient<T extends SourceCommon>(resource: 'local-source' | 'remote-source') {
    return {
        list: (opts?: { signal?: AbortSignal }) =>
            request<T[]>('get', `/${resource}`, undefined, opts),

        create: (source: Partial<T>, opts?: { signal?: AbortSignal }) =>
            request<T>('post', `/${resource}`, source, opts),

        update: (id: number, patch: Partial<T>, opts?: { signal?: AbortSignal }) =>
            request<T>('patch', `/${resource}/${id}`, patch, opts),

        remove: (id: number, opts?: { signal?: AbortSignal }) =>
            request<void>('delete', `/${resource}/${id}`, undefined, opts),
    }
}

const local = makeSourceClient<LocalSource>('local-source')
const remote = makeSourceClient<RemoteSource>('remote-source')

export const getLocalSources = local.list
export const getRemoteSources = remote.list
export const addLocalSource = local.create
export const addRemoteSource = remote.create
export const updateLocalSource = local.update
export const updateRemoteSource = remote.update
export const deleteLocalSource = local.remove
export const deleteRemoteSource = remote.remove