// app/common/toast/useToastStore.ts

import { create } from 'zustand'

export type ToastVariant = 'default' | 'success' | 'info' | 'warning' | 'danger'

export interface ToastItem {
    id: string
    title?: string
    description?: string
    variant?: ToastVariant
    duration?: number // ms, 기본 3500
    actionText?: string
    onAction?: () => void
    dismissible?: boolean // 기본 true
    key?: string
    compact?: boolean
}

interface ToastState {
    toasts: ToastItem[]
    lastByKey: Record<string, number>
    add: (t: Omit<ToastItem, 'id'>) => string
    remove: (id: string) => void
    clear: () => void
}

const DEDUPE_WINDOW_MS = 1500

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],
    lastByKey: {},
    add: (t) => {
        if (t.key) {
            const now = Date.now()
            const last = get().lastByKey[t.key] || 0
            if (now - last < DEDUPE_WINDOW_MS) return t.key
            set({ lastByKey: { ...get().lastByKey, [t.key]: now } })
        }

        const id = Math.random().toString(36).slice(2)
        const item: ToastItem = {
            id,
            variant: 'default',
            duration: 3000,
            dismissible: true,
            ...t,
        }
        set({ toasts: [item, ...get().toasts].slice(0, 6) })
        return id
    },
    remove: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
    clear: () => set({ toasts: [] }),
}))

export const toast = {
    show: (opts: Omit<ToastItem, 'id'>) => useToastStore.getState().add(opts),
    success: (opts: Omit<ToastItem, 'id' | 'variant'>) => useToastStore.getState().add({ variant: 'success', ...opts }),
    info: (opts: Omit<ToastItem, 'id' | 'variant'>) => useToastStore.getState().add({ variant: 'info', ...opts }),
    warning: (opts: Omit<ToastItem, 'id' | 'variant'>) => useToastStore.getState().add({ variant: 'warning', ...opts }),
    error: (opts: Omit<ToastItem, 'id' | 'variant'>) => useToastStore.getState().add({ variant: 'danger', ...opts }),
    dismiss: (id: string) => useToastStore.getState().remove(id),
    clear: () => useToastStore.getState().clear(),
    promise: async <T>(p: Promise<T>, msgs: {
        loading?: Omit<ToastItem, 'id'>
        success?: Omit<ToastItem, 'id'>
        error?: Omit<ToastItem, 'id'>
    }) => {
        const id = toast.show({ variant: 'info', description: '처리 중...', ...msgs.loading, duration: 100000 })
        try {
            const res = await p
            toast.dismiss(id)
            toast.success({ title: '완료', ...msgs.success })
            return res
        } catch (e: any) {
            toast.dismiss(id)
            toast.error({ title: '실패', description: e?.message ?? '오류가 발생했습니다.', ...msgs.error })
            throw e
        }
    }
}
