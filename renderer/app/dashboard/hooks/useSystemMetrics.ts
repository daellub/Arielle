// app/dashboard/hooks/useSystemMetrics.ts
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SystemMetrics } from '@/app/dashboard/types/SystemMetrics'

type Options = {
  historySize?: number   // 기본 90포인트
  paused?: boolean       // 일시정지(구독 중단)
}

/**
 * Electron Preload 가 노출한 window.metrics(snapshot/subscribe)을
 * 안전하게 사용하는 훅.
 * - SSR/미주입 환경에서도 오류 없이 동작
 * - HMR/재렌더 시 중복 구독 방지
 * - 메모리 누수 방지
 */
export default function useSystemMetrics(opts: Options = {}) {
  const { historySize = 90, paused = false } = opts

  const [latest, setLatest] = useState<SystemMetrics | null>(null)

  // 히스토리는 ref에 쌓고, 버전 tick 으로만 리렌더 유도
  const bufferRef = useRef<SystemMetrics[]>([])
  const versionRef = useRef(0)
  const [version, setVersion] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (paused) return

    let unsub: (() => void) | null = null
    let canceled = false

    const api: any = (typeof window !== 'undefined') ? (window as any).metrics : null

    async function boot() {
      // 스냅샷(선택)
      if (api?.snapshot) {
        try {
          const snap: SystemMetrics | null = await api.snapshot()
          if (!canceled && snap) {
            setLatest(snap)
            // 초깃값도 히스토리에 적재
            bufferRef.current.push(snap)
            trimBuffer()
            bump()
          }
        } catch { /* noop */ }
      }

      // 구독
      if (api?.subscribe) {
        unsub = api.subscribe((m: SystemMetrics) => {
          if (!mounted.current) return
          setLatest(m)
          bufferRef.current.push(m)
          trimBuffer()
          bump()
        })
      }
    }

    function trimBuffer() {
      const buf = bufferRef.current
      if (buf.length > historySize) {
        // 초과분만큼 한 번에 잘라 성능 최적화
        buf.splice(0, buf.length - historySize)
      }
    }

    function bump() {
      // 버전 tick → history 메모 갱신용
      versionRef.current += 1
      setVersion(versionRef.current)
    }

    boot()

    return () => {
      canceled = true
      try { unsub?.() } catch { /* noop */ }
    }
  }, [historySize, paused])

  // 최신 버전 기준으로 얕은 복제하여 안정된 배열 제공
  const history = useMemo(() => bufferRef.current.slice(), [version])

  return { latest, history }
}
