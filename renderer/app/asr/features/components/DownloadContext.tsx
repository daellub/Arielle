// app/asr/features/components/DownloadContext.tsx
'use client'

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useRef
} from 'react'
import axios, { CancelTokenSource } from 'axios'
import { io, Socket } from 'socket.io-client'
import { toast } from '@/app/common/toast/useToastStore'

export type DownloadStatus =
    'pending'
    | 'in-progress'
    | 'done'
    | 'error'
    | 'canceled'

export interface DownloadTask {
    id: string
    filename: string
    fullLabel: string
    progress: number
    status: DownloadStatus
    sizeMB?: number
    speedMBps?: number
    etaSec?: number
    path?: string
    cancelToken?: CancelTokenSource
    errorCode?: 'auth-required' | 'network' | 'server' | 'unknown'
}

interface DownloadContextType {
    tasks: DownloadTask[]
    addTask: (opts: {
        id: string
        filename: string
        downloadFn: (
            onProgress: (loaded: number, total: number) => void,
            token: CancelTokenSource,
            // 옵션
            options?: { hfToken?: string }
        ) => Promise<string>
    }) => void
    removeTask: (id: string) => void
    cancelIfRunning: (id: string) => void
}

const DownloadContext = createContext<DownloadContextType | null>(null)

export function useDownload() {
    const ctx = useContext(DownloadContext)
    if (!ctx) throw new Error('useDownload 함수는 DownloadProvider 내부에서 사용되어야 합니다!')
    return ctx
}

const HF_TOKEN_STORAGE_KEY = 'HF_TOKEN'
const HF_SETTINGS_URL = '/settings/huggingface'
const getHFToken = () => { try { return localStorage.getItem(HF_TOKEN_STORAGE_KEY) || undefined } catch { return undefined } }

async function extractAxiosError(err: any): Promise<{ status?: number; message: string }> {
    const status = err?.response?.status
    if (typeof err?.message === 'string' && !err?.response?.data) {
        return { status, message: err.message }
    }
    const data = err?.response?.data
    if (!data) return { status, message: 'Unknown error' }
    try {
        if (typeof data === 'string') return { status, message: data }
        // Blob -> 텍스트
        if (typeof Blob !== 'undefined' && data instanceof Blob) {
            const text = await data.text()
            return { status, message: text }
        }
        // JSON
        if (data?.message) return { status, message: data.message }
        return { status, message: JSON.stringify(data) }
    } catch {
        return { status, message: 'Unknown error' }
    }
}

function isAuthRequired(status?: number, message?: string) {
    const m = (message || '').toLowerCase()
    if (status === 401 || status === 403) return true
    return ['unauthorized', 'forbidden', 'private', 'requires', 'authorization', 'auth'].some(k => m.includes(k))
}

export function DownloadProvider({
    children,
    onDownloadStart,
    onDownloadComplete,
}: {
    children: ReactNode
    onDownloadStart?: (task: DownloadTask) => void
    onDownloadComplete?: (task: DownloadTask) => void
}) {
    const [tasks, setTasks] = useState<DownloadTask[]>([])
    const socketRef = useRef<Socket | null>(null)

    const updateTask = (id: string, updates: Partial<DownloadTask>) => {
        setTasks((ts) =>
            ts.map((t) => (t.id === id ? { ...t, ...updates } : t))
        )
    }

    const cancelIfRunning = (id: string) => {
        let canceledFile: string | null = null

        setTasks((ts) => {
            const target = ts.find(t => t.id === id)
            if (target?.status === 'in-progress' && target.cancelToken) {
                try { target.cancelToken.cancel('사용자 취소') } catch {}
                canceledFile = target.filename
            }
            return ts
        })

        if (canceledFile) {
            queueMicrotask(() => {
                toast.info({
                    title: '취소됨',
                    description: `"${canceledFile}" 다운로드가 취소되었어요.`,
                    key: `cancel-${id}`,
                    compact: true
                })
            })
        }
    }

    const removeTask = (id: string) => {
        cancelIfRunning(id)
        setTasks((ts) => ts.filter((t) => t.id !== id))
    }

    // socket.io 이벤트
    useEffect(() => {
        const s = io('http://localhost:8000', {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })
        socketRef.current = s

        s.on('hf_download_progress', (evt: any) => {
            // evt: { model_id, file, phase, loaded, total_bytes, size_bytes, speed_mbps, index, total }
            setTasks(tasks =>
                tasks.map(t => {
                    if (t.id !== evt.model_id) return t

                    if (evt.phase === 'start') {
                        return { ...t, fullLabel: `${evt.model_id}/${evt.file}`, progress: Math.max(t.progress, 0) }
                    }

                    if (evt.phase === 'chunk' && evt.loaded != null && evt.total_bytes) {
                        const pct = Math.round((evt.loaded / evt.total_bytes) * 100)
                        if (pct <= t.progress) return t
                        return { ...t, fullLabel: `${evt.model_id}/${evt.file}`, progress: pct, status: 'in-progress' }
                    }

                    if (evt.phase === 'end' && evt.size_bytes != null && evt.speed_mbps != null) {
                        const filePct = Math.round((evt.index / evt.total) * 100)
                        const sizeMB = evt.size_bytes / 1024 / 1024
                        const speed = evt.speed_mbps
                        const remainingFiles = Math.max(0, (evt.total ?? 1) - (evt.index ?? 0))
                        const eta = speed ? Math.ceil((remainingFiles * sizeMB) / speed) : undefined
                        return {
                            ...t,
                            fullLabel: `${evt.model_id}/${evt.file}`,
                            progress: Math.max(t.progress, filePct),
                            speedMBps: speed,
                            etaSec: eta,
                            status: filePct >= 100 ? 'done' : 'in-progress',
                        }
                    }

                    return t
                })
            )
        })

        s.on('hf_download_complete', (evt: { model_id: string; path: string; total_size_bytes: number }) => {
            const sizeMB = evt.total_size_bytes / 1024 / 1024
            let completedTask: DownloadTask | null = null

            setTasks(prev => {
                let found = false
                const updated = prev.map(t => {
                    if (t.id === evt.model_id) {
                        found = true
                        const currentSize = t.sizeMB ?? 0
                        const next = {
                            ...t,
                            status: 'done' as const,
                            path: evt.path,
                            progress: 100,
                            sizeMB: Math.max(currentSize, sizeMB),
                            speedMBps: undefined,
                            etaSec: undefined
                        }
                        completedTask = next
                        return next
                    }
                    return t
                })

                if (!found) {
                    const next: DownloadTask = {
                        id: evt.model_id,
                        filename: evt.model_id,
                        fullLabel: evt.model_id,
                        progress: 100,
                        status: 'done' as const,
                        sizeMB,
                        path: evt.path
                    }
                    updated.push(next)
                    completedTask = next
                }

                return [...updated]
            })

            if (completedTask) {
                queueMicrotask(() => {
                    toast.success({
                        title: '다운로드 완료',
                        description: `"${completedTask!.filename}"이(가) 다운로드가 완료되었어요`,
                        key: `done-${evt.model_id}`,
                        compact: true
                    })
                    onDownloadComplete?.(completedTask!)
                })
            }
        })

        s.on('disconnect', () => {
            console.log('[SOCKET] 연결 끊김 : 현재 작업을 유지합니다.')
        })

        return () => {
            s.off('hf_download_progress')
            s.off('hf_download_complete')
            s.off('disconnect')
            try { s.disconnect() } catch {}
            socketRef.current = null
        }
    }, [onDownloadComplete])

    const addTask = ({
        id,
        filename,
        downloadFn 
    }: {
        id: string
        filename: string
        downloadFn: (
            onProgress: (loaded: number, total: number) => void,
            token: CancelTokenSource,
            options?: { hfToken?: string }
        ) => Promise<string>
    }) => {
        // 중복 등록 방지
        const exists = tasks.some(t => t.id === id && (t.status === 'in-progress' || t.status === 'pending'))
        if (exists) {
            toast.info({ title: '이미 진행 중', description: `"${filename}" 다운로드가 이미 진행 중입니다.`, key: `dup-${id}`, compact: true })
            return
        }
        
        const cancelToken = axios.CancelToken.source() // TODO: AbortController로 교체 예정

        const newTask: DownloadTask = {
            id,
            filename,
            fullLabel: id,
            progress: 0,
            status: 'pending',
            sizeMB: 0,
            cancelToken
        }

        setTasks(ts => (ts.some(t => t.id === id) ? ts : [...ts, newTask]))
        onDownloadStart?.(newTask)
        // toast.info({ title: '다운로드 시작', description: `"${filename}" 다운로드를 시작합니다…`, key: `start-${id}`, compact: true })

        ;(async () => {
            try {
                updateTask(id, { status: 'in-progress' })

                let prevLoaded = 0, prevTime = Date.now()

                const onProg = (loaded: number, total: number) => {
                    const now = Date.now()
                    const dt = (now - prevTime) / 1000
                    const dLoaded = loaded - prevLoaded
                    const speed = dt > 0 ? (dLoaded / 1024 / 1024) / dt : undefined
                    const remainingBytes = Math.max(0, total - loaded)
                    const eta = speed
                        ? (remainingBytes / 1024 / 1024) / Math.max(speed, 1e-6)
                        : undefined
                    const pct = total > 0 ? Math.round((loaded / total) * 100) : undefined

                    updateTask(id, {
                        speedMBps: speed,
                        etaSec: eta,
                        progress: pct !== undefined ? Math.max(pct, 0) : undefined,
                        status: 'in-progress',
                    })

                    prevLoaded = loaded
                    prevTime = now
                }

                const token = getHFToken()

                // 1차 시도
                try {
                    await downloadFn(onProg, cancelToken, { hfToken: token })
                } catch (err: any) {
                    const { status, message } = await extractAxiosError(err)
                    if (isAuthRequired(status, message)) {
                        if (!token) {
                            updateTask(id, { status: 'error', errorCode: 'auth-required' })
                            toast.warning({
                                title: '인증 필요',
                                description: '이 모델은 접근 권한이 필요합니다. HuggingFace 토큰을 설정해 주세요.',
                                actionText: '토큰 설정',
                                onAction: () => { try { window.open(HF_SETTINGS_URL, '_blank') } catch {} },
                                duration: 8000,
                                key: `auth-${id}`,
                                compact: true,
                            })
                            return
                        }
                        // 토큰이 있는데도 실패: 1회 재시도
                        try {
                            await downloadFn(onProg, cancelToken, { hfToken: token })
                        } catch (err2:any) {
                            updateTask(id, { status: 'error', errorCode: 'auth-required' })
                            toast.error({
                                title: '권한 확인 실패',
                                description: '토큰 권한이 부족하거나 만료되었을 수 있어요. 토큰을 다시 확인해 주세요!',
                                actionText: '토큰 설정',
                                onAction: () => { try { window.open(HF_SETTINGS_URL, '_blank') } catch {} },
                                duration: 9000,
                                key: `authfail-${id}`,
                                compact: true,
                            })
                            return
                        }
                    } else {
                        throw err
                    }
                }

                // updateTask(id, { status: 'done', progress: 100 })

            } catch (err: any) {
                if (axios.isCancel(err) || err?.name === 'CanceledError') {
                    updateTask(id, { status: 'canceled' })
                    toast.info({ title: '취소됨', description: `"${filename}" 다운로드가 취소되었어요.`, key: `cancel-${id}`, compact: true })
                } else {
                    const { status, message } = await extractAxiosError(err)
                    const code: DownloadTask['errorCode'] =
                        status && status >= 500 ? 'server' : status ? 'network' : 'unknown'
                    updateTask(id, { status: 'error', errorCode: code })
                    toast.error({ title: '다운로드 실패', description: message || '알 수 없는 오류가 발생했어요.', key: `err-${id}`, compact: true })
                }
            }
        })()
    }

    return (
        <DownloadContext.Provider value={{ tasks, addTask, removeTask, cancelIfRunning }}>
            {children}
        </DownloadContext.Provider>
    )
}
