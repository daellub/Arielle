// app/components/MicStatus.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useMicStore } from '@/app/features/asr/store/useMicStore'
import { useMicInputLevel } from '@/app/features/asr/hooks/useMicInputLevel'

export default function MicStatus() {
    const {
        deviceId,
        deviceName,
        recordStatus,
        processStatus,
        inputThreshold,
    } = useMicStore()

    const inputLevelRaw = useMicInputLevel(deviceId)
    const inputLevel = deviceId ? inputLevelRaw : 0

    const [animatedLevel, setAnimatedLevel] = useState(inputLevel)

    const store = useMicStore()

    const actualRecordStatus =
        !deviceId ? 'unknown' : recordStatus

    const actualProcessStatus =
        !deviceId ? 'notready' : processStatus

    const micEnabled = !!deviceId

    
    useEffect(() => {
        const intervalId = setInterval(() => {
            setAnimatedLevel((prev) => {
                const diff = inputLevel - prev
                if (Math.abs(diff) < 1) return inputLevel
                return prev + diff * 0.1
            })
        }, 20)

        return () => clearInterval(intervalId)
    }, [inputLevel])

    const levelColor = 
        animatedLevel >= 80
            ? 'bg-red-500'
            : animatedLevel >= store.inputThreshold * 0.8
            ? 'bg-orange-400'
            : 'bg-blue-500'

    const processStatusColor =
        actualProcessStatus === 'ready' 
            ? 'bg-green-400'
            : actualProcessStatus === 'error'
            ? 'bg-red-400' 
            : 'bg-gray-400'

    const statusColor =
        actualRecordStatus === 'ready' 
            ? 'bg-green-400'
            : actualRecordStatus === 'input' 
            ? 'bg-orange-400'
            : actualRecordStatus === 'error'
            ? 'bg-red-400'
            : 'bg-gray-400'


    return (
        <div className='flex flex-col justify-between w-[300px] h-[250px] p-[24px] bg-white rounded-[30px] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] border border-gray-200'>
            <div className='flex items-center justify-between text-[18px] font-semibold text-black mb-1'>
                <span>Mic Status</span>
                <div className={`w-[12px] h-[12px] rounded-full shadow-sm ${statusColor}`} />
            </div>

            <div className='w-full h-[1px] bg-gray-300 mb-2' />

            <div className='text-[15px] leading-[1.6] space-y-3 text-black'>
                <div>
                    <div className='text-sm'>Device Info</div>
                    <div className='text-[14px] mx-1 text-neutral-500'>
                        {micEnabled ? deviceName : '마이크가 꺼져 있습니다.'}</div>
                </div>
                <div>
                    <div className="text-black">Input Level</div>
                    <div className="w-full h-[16px] mt-[4px] border border-gray-300 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${levelColor} transition-all duration-200`}
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
