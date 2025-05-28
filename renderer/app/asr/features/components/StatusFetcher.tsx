// app/asr/features/components/StatusFetcher.tsx
'use client'

import axios from 'axios'
import { useEffect } from 'react'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { useSystemStatusStore } from '@/app/asr/features/store/useSystemStatusStore'

export default function StatusFetcher() {
    const setDatabaseStatus = useSystemStatusStore((s) => s.setDatabaseStatus)
    const setModelStatusAndInfo = useSystemStatusStore((s) => s.setModelStatusAndInfo)
    
    const deviceId = useMicStore((s) => s.deviceId)
    const setRecordStatus = useMicStore((s) => s.setRecordStatus)
    const setHardwareInfo = useSystemStatusStore((s) => s.setHardwareInfo)

    useEffect(() => {
        const fetchStatus = async () => {
            try{
                const res = await axios.get('http://localhost:8000/api/asr/status')
                setDatabaseStatus(res.data.db)
                
                const modelRes = await axios.get('http://localhost:8000/api/asr/model/info')
                setModelStatusAndInfo(modelRes.data.loaded === true, modelRes.data.loaded ? modelRes.data : null)
            } catch (e) {
                console.error('상태 정보 가져오기 실패:', e)
                setDatabaseStatus(false)
                setModelStatusAndInfo(false, null)
            }
        }

        fetchStatus()
        const interval = setInterval(fetchStatus, 5000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let mounted = true
        const t = setTimeout(async () => {
            if (!deviceId) {
                setRecordStatus('unknown')
                return
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: deviceId } }
                })
                if (mounted) setRecordStatus('ready')
                stream.getTracks().forEach((track) => track.stop())
            } catch (err) {
                if (mounted) setRecordStatus('error')
            }
        }, 300)

        return () => {
            mounted = false
            clearTimeout(t)
        }
    }, [deviceId])

    useEffect(() => {
        const fetchHardwareInfo = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/hardware/info')
                setHardwareInfo(res.data)
            } catch (err) {
                console.warn('하드웨어 정보 가져오기 실패:', err)
                setHardwareInfo(null)
            }
        }
        fetchHardwareInfo()
    }, [])

    return null
}
