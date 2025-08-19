// app/store/useNotificationStore.ts
import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'info'

export interface ToastItem {
    id: number
    message: string
    type: NotificationType
    duration: number
}

interface NotificationState {
    // 공개 상태
    current: ToastItem | null
    visible: boolean
    isPaused: boolean
    remainingMs: number

    // 내부
    queue: ToastItem[]
    timerId: number | null
    lastTick: number | null

    // API
    show: (message: string, type?: NotificationType | { type?: NotificationType; duration?: number }) => void
    hide: () => void
    pause: () => void
    resume: () => void
    nextIfAny: () => void
    clear: () => void
}

// 내부
let TOAST_ID = 0
const DEFAULT_DURATION = 2000

export const useNotificationStore = create<NotificationState>((set, get) => ({
    current: null,
    visible: false,
    isPaused: false,
    remainingMs: DEFAULT_DURATION,

    queue: [],
    timerId: null,
    lastTick: null,

    show: (message, typeOrOpts) => {
        const opts =
            typeof typeOrOpts === 'string'
                ? { type: typeOrOpts as NotificationType, duration: DEFAULT_DURATION }
                : { type: (typeOrOpts?.type ?? 'info') as NotificationType, duration: typeOrOpts?.duration ?? DEFAULT_DURATION }
        
        const item: ToastItem = {
            id: ++TOAST_ID,
            message,
            type: opts.type,
            duration: Math.max(800, opts.duration) // 최소 800ms
        }

        const { current, visible } = get()
        if (!current || !visible) {
            // 즉시 표시
            set({
                current: item,
                visible: true,
                isPaused: false,
                remainingMs: item.duration,
                lastTick: performance.now()
            })

            // 타이머 시작
            startTimer(set, get)
        } else {
            // 큐에 추가
            set((s) => ({ queue: [...s.queue, item] }))
        }
    },

    hide: () => {
        stopTimer(set, get)
        set({ visible: false })
    },

    pause: () => {
        const { isPaused } = get()
        if (isPaused) return
        // 남은 시간 갱신
        syncRemaining(set, get)
        stopTimer(set, get)
        set({ isPaused: true })
    },

    resume: () => {
        const { isPaused, visible, current } = get()
        if (!isPaused || !visible || !current) return
        // 타이머 재개
        set({ isPaused: false, lastTick: performance.now() })
        startTimer(set, get)
    },

    nextIfAny: () => {
        const { queue } = get()
        if (queue.length === 0) {
            set({ current: null, remainingMs: DEFAULT_DURATION })
            return
        }
        const [head, ...rest] = queue
        set({
            current: head,
            queue: rest,
            visible: true,
            isPaused: false,
            remainingMs: head.duration,
            lastTick: performance.now()
        })
        startTimer(set, get)
    },

    clear: () => {
        stopTimer(set, get)
        set({
            current: null,
            visible: false,
            isPaused: false,
            remainingMs: DEFAULT_DURATION,
            queue: []
        })
    }
}))

/** 남은 시간 보정 */
function syncRemaining(set: any, get: any) {
    const { lastTick, remainingMs, isPaused } = get()
    if (isPaused || lastTick === null) return

    const now = performance.now()
    const dt = now - lastTick
    const rest = Math.max(0, remainingMs - dt)
    set({ remainingMs: rest, lastTick: now })
}

/** 타이머 시작 */
function startTimer(set: any, get: any) {
    stopTimer(set, get)
    const id = window.setInterval(() => {
        const state = get()
        if (!state.visible || !state.current || state.isPaused) return
        syncRemaining(set, get)
        const rest = get().remainingMs
        if (rest <= 0) {
            stopTimer(set, get)
            set({ visible: false })
        }
    }, 60)
    set({ timerId: id, lastTick: performance.now() })
}

/** 타이머 정지 */
function stopTimer(set: any, get: any) {
    const { timerId } = get()
    if (timerId != null) {
        clearInterval(timerId)
        set({ timerId: null })
    }
}