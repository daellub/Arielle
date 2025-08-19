// app/asr/features/store/useModelsStore.ts
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'
import type { Model } from '@/app/asr/features/types/Model'

export type ModelsState = {
    list: Model[]
    byId: Record<string, Model>
    setModels: (list: Model[]) => void
    updateModel: (model: Model) => void
    clear: () => void
}

export const useModelsStore = createWithEqualityFn<ModelsState>()(
    (set, get) => ({
        list: [],
        byId: {},
        setModels: (list) =>
            set({
                list,
                byId: Object.fromEntries(list.map((m) => [m.id, m])),
            }),
        updateModel: (model) =>
            set((state) => ({
                list: state.list.map((m) => (m.id === model.id ? model : m)),
                byId: { ...state.byId, [model.id]: model },
            })),
        clear: () => set({ list: [], byId: {} }),
    }),
    shallow
)