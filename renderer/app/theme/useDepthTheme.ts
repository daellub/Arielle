// app/theme/useDepthTheme.ts
/**
 * Arielle 프로젝트의 실험 버전으로 개발 중인 테마 기능입니다.
 */
import { create } from 'zustand'

type DepthState = {
    depth: number
    setDepth: (v: number) => void
}

export const useDepthTheme = create<DepthState>((set) => ({
    depth: 0,
    setDepth: (v) => set({ depth: Math.max(0, Math.min(1, v)) }),
}))
