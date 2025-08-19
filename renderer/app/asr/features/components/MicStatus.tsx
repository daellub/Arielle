// app/asr/features/components/MicStatus.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { shallow } from 'zustand/shallow'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { useMicInputLevel } from '@/app/asr/features/hooks/useMicInputLevel'
import type { MicState } from '@/app/asr/features/store/useMicStore'

export default function MicStatus() {
    const selectMic = (s: MicState) => ({
        deviceId: s.deviceId,
        deviceName: s.deviceName,
        recordStatus: s.recordStatus,
        processStatus: s.processStatus,
        inputThreshold: s.inputThreshold,
    })

    const {
        deviceId,
        deviceName,
        recordStatus,
        processStatus,
        inputThreshold,
    } = useMicStore(
        selectMic,
        shallow
    )

    const inputLevelRaw = useMicInputLevel(deviceId)
    const inputLevel = deviceId ? inputLevelRaw : 0

    const [animatedLevel, setAnimatedLevel] = useState(0)
    const targetRef = useRef(0)

    useEffect(() => {
        targetRef.current = Math.max(0, Math.min(100, inputLevel))
    }, [inputLevel])

    useEffect(() => {
        let raf = 0
        const tick = () => {
            setAnimatedLevel((prev) => {
                const diff = targetRef.current - prev
                if (Math.abs(diff) < 0.5) return targetRef.current
                return Math.max(0, Math.min(100, prev + diff * 0.15))
            })
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])

    const actualRecordStatus = !deviceId ? 'unknown' : recordStatus
    const actualProcessStatus = !deviceId ? 'notready' : processStatus
    const micEnabled = !!deviceId

    const levelColor = useMemo(() => {
        if (animatedLevel >= 80) return 'bg-red-500'
        if (animatedLevel >= inputThreshold * 0.8) return 'bg-orange-400'
        return 'bg-blue-500'
    }, [animatedLevel, inputThreshold])

    const processStatusColor = useMemo(() => {
        return actualProcessStatus === 'ready'
        ? 'bg-green-400'
        : actualProcessStatus === 'error'
        ? 'bg-red-400'
        : 'bg-gray-400'
    }, [actualProcessStatus])

    const statusColor = useMemo(() => {
        return actualRecordStatus === 'ready'
        ? 'bg-green-400'
        : actualRecordStatus === 'input'
        ? 'bg-orange-400'
        : actualRecordStatus === 'error'
        ? 'bg-red-400'
        : 'bg-gray-400'
    }, [actualRecordStatus])


    return (
        <div className="flex flex-col justify-between w-[300px] h-[250px] px-6 py-6 
            bg-white/50 backdrop-blur-md border border-white/10 
            shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)] rounded-2xl transition-all"
        >
            <div className='flex items-center justify-between text-[18px] font-semibold text-black mb-1'>
                <span>Mic Status</span>
                <div className={`w-[12px] h-[12px] rounded-full shadow-sm ${statusColor}`} />
            </div>

            <div className='w-full h-[1px] bg-gray-300 mb-2' />

            <div className='text-[15px] leading-[1.6] space-y-3 text-black'>
                <div>
                    <div className='text-sm'>Device Info</div>
                    <div className='text-[14px] mx-1 text-neutral-500'>
                        {micEnabled ? deviceName : '마이크가 꺼져 있습니다.'}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between text-black">
                        <span>Input Level</span>
                        <span className="text-xs text-neutral-500">{Math.round(animatedLevel)}%</span>
                    </div>
                    <div
                        className="w-full h-[16px] mt-[4px] border border-gray-300 bg-gray-200 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.round(animatedLevel)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className={`h-full ${levelColor} transition-[width] duration-150 ease-out`}
                            style={{ width: `${animatedLevel}%` }}
                        />
                    </div>
                </div>

                <div className='flex justify-between items-center'>
                    <div className="text-black">Process Status</div>
                    <div
                        className={`w-[12px] h-[12px] rounded-full ${processStatusColor}`} />
                </div>
            </div>
        </div>
    )
}
