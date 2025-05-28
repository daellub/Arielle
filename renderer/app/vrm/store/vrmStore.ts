// app/vrm/store/vrmStore.ts
import { create } from 'zustand'

interface PoseBlend {
    idle: number
    wave: number
    point: number
    listen: number
}

interface VRMState {
    selectedEmotion: string
    emotionStrength: number
    poseBlend: PoseBlend
    isFlash: boolean
    isLoading: boolean
    isPlayed: boolean

    setEmotion: (emotion: string) => void
    setEmotionStrength: (strength: number) => void
    setPoseBlend: (key: keyof PoseBlend, value: number) => void
    setFlash: (value: boolean) => void
    setLoading: (value: boolean) => void
    setPlayed: (value: boolean) => void
}

export const useVRMStore = create<VRMState>((set) => ({
    selectedEmotion: 'neutral',
    emotionStrength: 50,
    poseBlend: {
        idle: 100,
        wave: 0,
        point: 0,
        listen: 0,
    },
    isFlash: false,
    isLoading: false,
    isPlayed: false,

    setEmotion: (emotion) => set({ selectedEmotion: emotion }),
    setEmotionStrength: (strength) => set({ emotionStrength: strength }),
    setPoseBlend: (key, value) =>
        set((state) => ({
            poseBlend: {
                ...state.poseBlend,
                [key]: value,
            },
        })),
    setFlash: (value) => set({ isFlash: value }),
    setLoading: (value) => set({ isLoading: value }),
    setPlayed: (value) => set({ isPlayed: value }),
}))
