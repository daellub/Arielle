// app/features/asr/components/DownloadContext.tsx
'use client'

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode 
} from 'react'
import axios, { CancelTokenSource } from 'axios'
import { io } from 'socket.io-client'

const socket = io("http://localhost:8000")

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
}

interface DownloadContextType {
    tasks: DownloadTask[]
    addTask: (opts: {
        id: string
        filename: string
        downloadFn: (
            onProgress: (loaded: number, total: number) => void,
            token: CancelTokenSource
        ) => Promise<string>
    }) => void
    removeTask: (id: string) => void
}

const DownloadContext = createContext<DownloadContextType | null>(null)

export function useDownload() {
    const ctx = useContext(DownloadContext)
    if (!ctx) throw new Error('useDownload must be used inside DownloadProvider')
    return ctx
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

    const updateTask = (id: string, updates: Partial<DownloadTask>) => {
        setTasks((ts) =>
            ts.map((t) => (t.id === id ? { ...t, ...updates } : t))
        )
    }
    const removeTask = (id: string) => {
        setTasks((ts) => ts.filter((t) => t.id !== id))
    }

    useEffect(() => {
        socket.on('hf_download_progress', evt => {
            setTasks(tasks =>
                tasks.map(t => {
                    if (t.id !== evt.model_id) return t
            
                    if (evt.phase === 'start') {
                        return {
                            ...t,
                            fullLabel: `${evt.model_id}/${evt.file}`,
                            progress: 0
                        }
                    }
            
                    if (evt.phase === 'chunk' && evt.loaded != null && evt.total_bytes) {
                        const pct = Math.round((evt.loaded / evt.total_bytes) * 100)

                        if (pct === 0) return t

                        return {
                            ...t,
                            fullLabel: `${evt.model_id}/${evt.file}`,
                            progress: pct
                        }
                    }
            
                    if (evt.phase === 'end' && evt.size_bytes != null && evt.speed_mbps != null) {
                        const filePct = Math.round((evt.index / evt.total) * 100)
                        const sizeMB = evt.size_bytes / 1024 / 1024
                        const speed = evt.speed_mbps
                        const remainingFiles = evt.total - evt.index
                        const eta = Math.ceil((remainingFiles * sizeMB) / speed)
                        return {
                                ...t,
                                fullLabel: `${evt.model_id}/${evt.file}`,
                                progress: filePct,
                                speedMBps: speed,
                                etaSec: eta,
                                status: filePct === 100 ? 'done' : 'in-progress',
                            }
                    }
            
                    return t
                })
            )
        })

        socket.on("hf_download_complete", (evt: {
            model_id: string
            path: string
            total_size_bytes: number
        }) => {
            const sizeMB = evt.total_size_bytes / 1024 / 1024

            setTasks(prev => {
                let found = false
                const updated = prev.map(t => {
                    if (t.id === evt.model_id) {
                        console.log("▶️ task.path BEFORE:", t.path)
                        found = true
                        const currentSize = t.sizeMB ?? 0
                        return {
                            ...t,
                            status: 'done' as const,
                            path: evt.path,
                            progress: 100,
                            sizeMB: Math.max(currentSize, sizeMB),
                            speedMBps: undefined,
                            etaSec: undefined
                        }
                    }
                    return t
                })

                if (!found) {
                    updated.push({
                        id: evt.model_id,
                        filename: evt.model_id,
                        fullLabel: evt.model_id,
                        progress: 100,
                        status: 'done' as const,
                        sizeMB,
                        path: evt.path
                    })
                }

                const completedTask = updated.find(t => t.id === evt.model_id)
                if (completedTask && onDownloadComplete) {
                    onDownloadComplete(completedTask)
                }

                return [...updated]
            })
        })

        socket.on('disconnect', () => {
            console.log('[SOCKET] Disconnected - Clearing Download Tasks')
            setTasks([])
        })

        return () => {
            socket.off('hf_download_progress')
            socket.off("hf_download_complete")
            socket.off('disconnect')
        }
    }, [])

    const addTask = ({
        id,
        filename,
        downloadFn 
    }: {
        id: string
        filename: string
        downloadFn: (
            onProgress: (loaded: number, total: number) => void,
            token: CancelTokenSource
        ) => Promise<string>
    }) => {
        const cancelToken = axios.CancelToken.source()

        const newTask: DownloadTask = {
            id,
            filename,
            fullLabel: id,
            progress: 0,
            status: 'pending',
            sizeMB: 0,
            cancelToken
        }

        setTasks(ts => {
            const exists = ts.some(t => t.id === id)
            if (exists) return ts
            return [...ts, newTask]
        })

        if (onDownloadStart) onDownloadStart(newTask)

        ;(async () => {
            try {
                updateTask(id, { status: 'in-progress' })
                let prevLoaded = 0
                let prevTime = Date.now()

                await downloadFn((loaded, total) => {
                    const now = Date.now()
                    const dt = (now - prevTime) / 1000
                    const dLoaded = loaded - prevLoaded
                    
                    const speed = dt > 0 ? (dLoaded / 1024 / 1024) / dt : undefined
                    const remainingBytes = total - loaded
                    const eta = speed
                        ? (remainingBytes / 1024 / 1024) / speed
                        : undefined
                    
                    updateTask(id, {
                        speedMBps: speed,
                        etaSec: eta
                    })

                    prevLoaded = loaded
                    prevTime = now
                }, cancelToken)
            } catch (err: any) {
                if (axios.isCancel(err)) {
                    updateTask(id, { status: 'canceled' })
                } else if (err?.response?.status === 500 && err?.message?.includes("Download canceled by user")) {
                    updateTask(id, { status: 'canceled' })
                } else {
                    console.error('⛔️ 다운로드 실패:', err.message || err)
                    updateTask(id, { status: 'error' })
                }
            }
        })()
    }

    return (
        <DownloadContext.Provider value={{ tasks, addTask, removeTask}}>
            {children}
        </DownloadContext.Provider>
    )
}
