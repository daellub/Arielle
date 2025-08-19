// app/asr/features/utils/api.ts
import axios, { AxiosError, AxiosInstance } from 'axios'
import type { Model } from '@/app/asr/features/types/Model'

/** Environment variables */
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const TIMEOUT_MS = 8000

/** Axios instance */
const http: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
    },
    // withCredentials: true
})

/** Error Message Map */
function normalizeError(e: unknown): Error {
    // axios 취소: code='ERR_CANCELED', name='CanceledError'
    // fetch 취소: name='AbortError'
    const any = e as any
    
    if (
        (typeof any?.code === 'string' && any.code === 'ERR_CANCELED') ||
        any?.name === 'CanceledError' ||
        any?.name === 'AbortError' ||
        (typeof any?.message === 'string' && any.message.toLowerCase().includes('canceled'))
    ) {
        const err = any instanceof Error ? any : new Error('Request canceled')
        err.name = err.name || 'CanceledError'
        ;(err as any).isCanceled = true
        return err
    }

    if (axios.isAxiosError(e)) {
        const ae = e as AxiosError<any>
        const code = ae.code ?? 'AXIOS_ERR'
        const status = ae.response?.status
        const msg = ae.response?.data?.message || ae.message
        return new Error(`[${status ?? code}] ${msg}`)
    }
    return e instanceof Error ? e : new Error(String(e))
}

/** 인플라이트 요청 */
const inflight = new Map<string, Promise<any>>()
function makeKey(method: string, url: string, body?: any) {
    return `${method} ${url} ${body ? JSON.stringify(body) : ''}`
}

/** TTL 캐시 */
type CacheEntry<T> = { ts: number; data: T }
const cache = new Map<string, CacheEntry<any>>()
const DEFAULT_TTL = 2000 // ms

/** 헬퍼 */
async function getJSON<T>(
    url: string,
    opts?: { signal?: AbortSignal; cacheTTL?: number }
): Promise<T> {
    const ttl = opts?.cacheTTL ?? 0
    const cacheHit = cache.get(url)
    const now = Date.now()

    if (ttl > 0 && cacheHit && now - cacheHit.ts < ttl) {
        return cacheHit.data as T
    }

    const key = makeKey('GET', url)
    if (inflight.has(key)) {
        return inflight.get(key)! as Promise<T>
    }

    const p = http.get<T>(url, { signal: opts?.signal })
        .then(res => {
            if (ttl > 0) cache.set(url, { ts: Date.now(), data: res.data })
            return res.data
        })
        .catch(err => { throw normalizeError(err) })
        .finally(() => { inflight.delete(key) })

    inflight.set(key, p)
    return p
}

async function postJSON<T>(
    url: string,
    body?: any,
    opts?: { signal?: AbortSignal }
): Promise<T> {
    const key = makeKey('POST', url, body)
    if (inflight.has(key)) {
        return inflight.get(key)! as Promise<T>
    }

    const p = http.post<T>(url, body ?? {}, { signal: opts?.signal })
        .then(res => res.data)
        .catch(err => { throw normalizeError(err) })
        .finally(() => { inflight.delete(key) })

    inflight.set(key, p)
    return p
}

/** =======================
 *  Public APIs
 *  ======================= */

/** 모델 목록 조회 */

export async function fetchModels(opts?: { signal?: AbortSignal; force?: boolean }) {
    const url = '/asr/models'
    if (opts?.force) cache.delete(url)
    return getJSON<Model[]>(url, { signal: opts?.signal, cacheTTL: DEFAULT_TTL })
}

export async function loadModelById(modelId: string, opts?: { signal?: AbortSignal }) {
    return postJSON<{ status: string }>(`/asr/models/load/${modelId}`, {}, { signal: opts?.signal })
}

export type UnloadResponse = { status: 'success' | 'skipped'; model_id: string }

export async function unloadModelById(modelId: string, opts?: { signal?: AbortSignal }) {
    return postJSON<UnloadResponse>(`/asr/models/unload/${modelId}`, {}, { signal: opts?.signal })
}


// 캐시 무효화
export function invalidateModelsCache() {
    cache.delete('/asr/models')
}