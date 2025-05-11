// app/store/tabStore.ts
import { create } from 'zustand'

type TabState = {
    selectedTab: string
    setSelectedTab: (tab: string) => void
}

export const useTabStore = create<TabState>((set) => ({
    selectedTab: 'Home',
    setSelectedTab: (tab) => set({ selectedTab: tab }),
}))
