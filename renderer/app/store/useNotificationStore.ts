// app/store/useNotificationStore.ts
import { create } from 'zustand'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationState {
    message: string
    type: NotificationType
    visible: boolean
    show: (message: string, type?: NotificationType) => void
    hide: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
    message: '',
    type: 'info',
    visible: false,
    show: (message, type = 'info') => {
        set({ message, type, visible: true })
        setTimeout(() => set({ visible: false }), 1500)
    },
    hide: () => set({ visible: false }),
}))