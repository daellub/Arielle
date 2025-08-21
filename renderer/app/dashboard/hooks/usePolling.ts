// app/dashboard/hooks/usePolling.ts
import { useEffect } from 'react'

export function usePolling(fn: () => Promise<void>, intervalMs: number, deps: any[] = []) {
    useEffect(() => {
        let alive = true
        let id: number | null = null
        const tick = async () => {
            if (!alive) return
            await fn()
            if (!alive) return
            id = window.setTimeout(tick, intervalMs)
        }
        tick()
        return () => {
            alive = false
            if (id) window.clearTimeout(id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}