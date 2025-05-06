// app/asr/features/store/useSelectedModelStore.ts
import { create } from 'zustand'
import { Model } from '../types/Model'

interface SelectedModelState {
    selectedModel: Model | null
    setSelectedModel: (model: Model) => void
    clearSelectedModel: () => void
}

export const useSelectedModelStore = create<SelectedModelState>((set) => ({
    selectedModel: null,
    setSelectedModel: (model) => set({ selectedModel: model }),
    clearSelectedModel: () => set({ selectedModel: null }),
}))