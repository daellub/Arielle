// app/store/useRecordingStore.ts
import { create } from 'zustand'

interface RecordingState {
    isRecording: boolean
    setRecording: (v: boolean) => void
    toggle: () => void
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
    isRecording: false,
    setRecording: (v: boolean) => set({ isRecording: v }),
    toggle: () => set({ isRecording: !get().isRecording })
}))
