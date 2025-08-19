// app/asr/features/store/useSelectedModelStore.ts
import { create } from 'zustand'

interface SelectedModelState {
    selectedModelId: string | null
    selectById: (id: string) => void
    clear: () => void
}

export const useSelectedModelStore = create<SelectedModelState>((set) => ({
    selectedModelId: null,
    selectById: (id) => set({ selectedModelId: id }),
    clear: () => set({ selectedModelId: null }),
}))