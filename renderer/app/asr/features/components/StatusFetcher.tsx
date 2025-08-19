// app/asr/features/components/StatusFetcher.tsx
'use client'

import { useEffect } from 'react'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { useSystemStatusStore } from '@/app/asr/features/store/useSystemStatusStore'

type StreamPayload = {
    db: boolean
    loaded: boolean
    model: {
        name: string
        framework: string
        device: string
        language: string
        loaded: boolean
        created_at: string
    } | null
    hardware: {
        cpu: string
        cpu_usage: string
        ram: { total: string; used_percent: string }
        disk: { total: string; used_percent: string }
    } | null
    ts: number
    error?: string
}

export default function StatusFetcher() {
    const setDatabaseStatus = useSystemStatusStore((s) => s.setDatabaseStatus)
    const setModelStatusAndInfo = useSystemStatusStore((s) => s.setModelStatusAndInfo)
    const setHardwareInfo = useSystemStatusStore((s) => s.setHardwareInfo)

    const deviceId = useMicStore((s) => s.deviceId)
    const setRecordStatus = useMicStore((s) => s.setRecordStatus)

    useEffect(() => {
        const es = new EventSource('http://localhost:8000/api/asr/status/stream')

        const onStatus = (ev: MessageEvent) => {
            try {
                const data: StreamPayload = JSON.parse(ev.data)
                setDatabaseStatus(!!data.db)
                setModelStatusAndInfo(!!data.loaded, data.loaded ? data.model : null)
                if (data.hardware !== undefined) {
                    setHardwareInfo(data.hardware)
                }
            } catch (e) {
                console.warn('SSE 데이터 파싱 실패:', e)
            }
        }

        const onPing = (_ev: MessageEvent) => {}

        es.addEventListener('status', onStatus as any)
        es.addEventListener('ping', onPing as any)
        es.onerror = () => {
            // 일시적 에러 -> 브라우저가 자동 재연결
            // 원하면 임시로 inactive 표시 가능
            // setDatabaseStatus(false)
            // setModelStatusAndInfo(false, null)
        }

        return () => {
            es.removeEventListener('status', onStatus as any)
            es.removeEventListener('ping', onPing as any)
            es.close()
        }
    }, [setDatabaseStatus, setModelStatusAndInfo, setHardwareInfo])

    useEffect(() => {
        let mounted = true
        const t = setTimeout(async () => {
            if (!deviceId) {
                setRecordStatus('unknown')
                return
            }
            try {
                try {
                    const perm = await (navigator as any).permissions?.query?.({ name: 'microphone' })
                    if (perm && perm.state === 'denied') {
                        if (mounted) setRecordStatus('error')
                        return
                    }
                } catch {}

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: deviceId } }
                })
                if (mounted) setRecordStatus('ready')
                stream.getTracks().forEach((track) => track.stop())
            } catch {
                if (mounted) setRecordStatus('error')
            }
        }, 300)

        return () => {
            mounted = false
            clearTimeout(t)
        }
    }, [deviceId, setRecordStatus])

    return null
}
