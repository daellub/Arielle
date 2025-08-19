// app/asr/features/utils/huggingFaceAPI.ts
import axios, { AxiosError, AxiosInstance } from 'axios'

export interface HFCardData {
    pretty_name?: string
    thumbnail?: string
    description?: string
}

export interface HuggingFaceModel {
    id: string
    pipeline_tag?: string
    likes?: number
    downloads?: number
    tags?: string[]
    library_name?: string
    cardData?: HFCardData
}

const HF_BASE_URL = 'https://huggingface.co'
const TIMEOUT_MS = 8000

const hf: AxiosInstance = axios.create({
    baseURL: HF_BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
        Accept: 'application/json'
    }
})

function normalizeError(e: unknown): Error {
    const any = e as any

    if (
        any?.code === 'ERR_CANCELED' ||
        any?.name === 'CanceledError' ||
        any?.name === 'AbortError' ||
        (typeof any?.message === 'string' && any.message.toLowerCase().includes('canceled'))
    ) {
        const err = any instanceof Error ? any : new Error('Request canceled')
        err.name = 'CanceledError'
        ;(err as any).isCanceled = true
        return err
    }

    if (axios.isAxiosError(e)) {
        const ae = e as AxiosError<any>
        const status = ae.response?.status
        const msg =
            (ae.response?.data && (ae.response.data.message || ae.response.data.error)) ||
            ae.message
        return new Error(`[HF${status ? ` ${status}` : ''}] ${msg}`)
    }

    return e instanceof Error ? e : new Error(String(e))
}

type CacheEntry<T> = { ts: number; data: T }
const cache = new Map<string, CacheEntry<any>>()
const inflight = new Map<string, Promise<any>>()

function keyOf(path: string, params?: Record<string, any>) {
    return `${path}?${params ? JSON.stringify(params) : ''}`
}

function fromCache<T>(key: string, ttl: number): T | null {
    if (!ttl) return null
    const c = cache.get(key)
    if (c && Date.now() - c.ts < ttl) return c.data as T
    return null
}

function setCache<T>(key: string, data: T) {
    cache.set(key, { ts: Date.now(), data })
}

export type FetchHFOptions = {
    limit?: number
    search?: string
    pipelineTag?: string // 기본: ASR
    sortBy?: 'downloads' | 'likes' | 'id' // 클라이언트 정렬
    signal?: AbortSignal
    cacheTTL?: number // ms (기본 30초)
    refresh?: boolean
}

/**
 * HuggingFace 모델 목록
 */
export async function fetchHuggingFaceModels(opts: FetchHFOptions = {}): Promise<HuggingFaceModel[]> {
    const {
        limit = 30,
        search,
        pipelineTag = 'automatic-speech-recognition',
        sortBy = 'downloads',
        signal,
        cacheTTL = 30_000,
        refresh = false,
    } = opts

    const path = '/api/models'
    const params: Record<string, any> = {
        pipeline_tag: pipelineTag,
        limit,
    }
    if (search && search.trim()) params.search = search.trim()

    const k = keyOf(path, params)

    if (!refresh) {
        const hit = fromCache<HuggingFaceModel[]>(k, cacheTTL)
        if (hit) return hit
    }

    if (inflight.has(k)) {
        return inflight.get(k)!
    }

    const p = hf
        .get<HuggingFaceModel[]>(path, { params, signal })
        .then((res) => {
            const list = Array.isArray(res.data) ? res.data : []
            const normalized = list.map((m) => normalizeModel(m))
            const sorted = sortModels(normalized, sortBy)
            const sliced = sorted.slice(0, limit)
            setCache(k, sliced)
            return sliced
        })
        .catch((err) => {
            throw normalizeError(err)
        })
        .finally(() => {
            inflight.delete(k)
        })

    inflight.set(k, p)
    return p
}

export function invalidateHFCache() {
    cache.clear()
}

function normalizeModel(m: HuggingFaceModel): HuggingFaceModel {
    return {
        id: m.id,
        pipeline_tag: m.pipeline_tag ?? undefined,
        likes: typeof m.likes === 'number' ? m.likes : 0,
        downloads: typeof m.downloads === 'number' ? m.downloads : 0,
        tags: Array.isArray(m.tags) ? m.tags : [],
        library_name: m.library_name ?? undefined,
        cardData: m.cardData
        ? {
            pretty_name: m.cardData.pretty_name,
            thumbnail: m.cardData.thumbnail,
            description: m.cardData.description,
            }
        : undefined,
    }
}

function sortModels(list: HuggingFaceModel[], sortBy: FetchHFOptions['sortBy']) {
    const arr = [...list]
    if (sortBy === 'likes') {
        arr.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    } else if (sortBy === 'id') {
        arr.sort((a, b) => (a.id > b.id ? 1 : -1))
    } else {
        arr.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
    }
    return arr
}

export function generateModelDescription(model: HuggingFaceModel): string {
    const framework = model.library_name?.toUpperCase?.() || 'UNKNOWN'
    const tags = model.tags || []

    const licenseTag = tags.find((t) => t.startsWith('license:'))
    const license = licenseTag ? licenseTag.split(':')[1]?.toUpperCase() : '라이선스 미확인'

    const extras: string[] = []
    if (tags.some((t) => /onnx/i.test(t))) extras.push('ONNX')
    if (tags.some((t) => /(int8|int4|quant)/i.test(t))) extras.push('양자화')
    if (tags.some((t) => /ctc|transducer|rnnt/i.test(t))) extras.push('스트리밍')
    if (tags.some((t) => /whisper/i.test(t))) extras.push('Whisper 계열')

    const extraStr = extras.length ? ` · ${extras.join(' / ')}` : ''

    return `${framework} 기반 모델 (${license} License)${extraStr}`
}