// app/store/useRecordingStore.ts
import { create } from 'zustand'

interface RecordingState {
    isRecording: boolean
    setRecording: (v: boolean) => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
    isRecording: false,
    setRecording: (v: boolean) => set({ isRecording: v }),
}))
