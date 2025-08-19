// app/common/ui/useUIOverlayStore.ts
import React from 'react'
import { create } from 'zustand'

interface UiOverlayState {
    overlayCount: number
    increment: () => void
    decrement: () => void
    get hasOverlay(): boolean
}

export const useUiOverlayStore = create<UiOverlayState>((set, get) => ({
    overlayCount: 0,
    increment: () => set(s => ({ overlayCount: s.overlayCount + 1 })),
    decrement: () => set(s => ({ overlayCount: Math.max(0, s.overlayCount - 1) })),
    get hasOverlay() { return get().overlayCount > 0 },
}))

export function useOverlayGate(open: boolean) {
    const inc = useUiOverlayStore(s => s.increment)
    const dec = useUiOverlayStore(s => s.decrement)
    React.useEffect(() => {
        if (open) inc()
        return () => { if (open) dec() }
        // open이 변할 때마다 반영
    }, [open, inc, dec])
}
