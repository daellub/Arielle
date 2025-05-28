// app/vrm/hooks/useParallaxEffect.ts
import { useEffect } from 'react'

export function useParallaxEffect() {
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5).toFixed(2)
            const y = (e.clientY / window.innerHeight - 0.5).toFixed(2)
            document.documentElement.style.setProperty('--mx', x)
            document.documentElement.style.setProperty('--my', y)
        }
        window.addEventListener('mousemove', handle)
        return () => window.removeEventListener('mousemove', handle)
    }, [])
}
