// app/components/Settings.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'
import React, { useEffect, useState } from 'react'
import MicStatus from './MicStatus'
import { useMicInputLevel } from '@/app/features/asr/hooks/useMicInputLevel'
import { useMicStore } from '@/app/features/asr/store/useMicStore'

interface Props {
    onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
    const [testing, setTesting] = useState(false);

    const {
        setDevice,
        inputThreshold,
        setThreshold,
        sampleRate,
        setSampleRate,
        noiseSuppression,
        setNoiseSuppression,
        echoCancellation,
        setEchoCancellation,
    } = useMicStore()

    const inputLevel = useMicInputLevel(testing ? selectedDeviceId : undefined)

    const store = useMicStore()

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then((devs) => {
            const audioInputs = devs.filter((d) => d.kind === 'audioinput')
            setDevices(audioInputs)
            if (audioInputs.length > 0) setSelectedDeviceId(audioInputs[0].deviceId)
        })
    }, [])

    const handleSave = () => {
        if (!selectedDeviceId) {
            store.setDevice(undefined, '사용 안함')
        } else {
            const selected = devices.find((d) => d.deviceId === selectedDeviceId)
            if (selected) {
                store.setDevice(selected.deviceId, selected.label)
            }
        }
        onClose()
    }

    const adjustedLevel = inputLevel * (store.volumeGain / 100)

    const isAboveThreshold = adjustedLevel >= store.inputThreshold

    useEffect(() => {
        // console.log("Volume Gain:", store.volumeGain);
        // console.log("Original Level:", inputLevel);
        // console.log("Adjusted Level:", adjustedLevel);
        // console.log("inputThreshold:", store.inputThreshold);
    }, [inputLevel])

    return (
        <div className='fixed inset-0 z-50 bg-black/40 backdrop-blur-[4px] flex text-black items-center justify-center'>
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className='flex bg-white w-[900px] h-[550px] p-8 rounded-2xl shadow-lg gap-8'
            >
                <div className='w-[70%]'>
                    <h2 className='text-2xl font-bold mb-4 text-black'>⚙️ ASR 환경 설정</h2>
                    
                    <div className='mb-4'>
                        <label className='block text-sm font-semibold mb-2 text-gray-700'>입력 장치 선택</label>
                        <select
                            className='w-full border px-3 py-2 rounded'
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                        >
                            <option value="">🎙 마이크 사용 안함</option>
                            {devices.map((d) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || '이름 없는 장치'}
                                </option>
                            ))}
                        </select>

                        <div className='flex items-center gap-3'>
                            <button
                                className='mt-2 px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm border'
                                onClick={() => setTesting(!testing)}
                            >
                                {testing ? '⏹ 테스트 종료' : '🎤 마이크 테스트'}
                            </button>
                        
                            {testing && (
                                <div className='mt-2 flex items-center gap-2'>
                                    <div className='w-3 h-3 rounded-full transition-colors duration-200'
                                        style={{ 
                                            backgroundColor: isAboveThreshold ? '#3B82F6' : '#D1D5DB'
                                        }}
                                    />
                                    <span className="text-sm text-gray-600">
                                        {isAboveThreshold ? '소리 감지됨' : '대기 중'}
                                    </span>
                                    {/* 디버그용 */}
                                    {/* <div className="mt-2 text-sm text-gray-500 space-y-1">
                                        <div>
                                            🎧 원본 입력 레벨: <span className="font-mono">{inputLevel.toFixed(3)}</span>
                                        </div>
                                        <div>
                                            🔊 볼륨 반영: <span className="font-mono">{(adjustedLevel).toFixed(1)}%</span>
                                        </div>
                                        <div>
                                            🎯 임계값 기준: <span className="font-mono">{store.inputThreshold}%</span>
                                        </div>
                                    </div> */}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-semibold mb-2'>마이크 볼륨 조절</label>
                        <div className='flex justify-between'>
                            <span>0</span>
                            <span>{store.volumeGain}</span>
                            <span>100</span>
                        </div>
                        <input 
                            type="range"
                            min={0}
                            max={100}
                            value={store.volumeGain}
                            onChange={(e) => store.setVolumeGain(Number(e.target.value))}
                            className='w-full'
                        />
                    </div>

                    <div className='mb-4'>
                        <div className='flex gap-4'>
                            <label className='block text-sm font-semibold mb-2'>입력 임계값 (%)</label>
                            {store.useVAD && (
                                <span className='text-red-500 text-sm font-omyu_pretty mb-2'>VAD가 활성화된 상태입니다.</span>
                            )}
                        </div>
                        <div className='flex justify-between'>
                            <span>10</span>
                            <span>{store.inputThreshold}</span>
                            <span>100</span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={100}
                            value={store.inputThreshold}
                            onChange={(e) => store.setThreshold(Number(e.target.value))}
                            disabled={useMicStore((state) => state.useVAD)}
                            className='w-full'
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-semibold mb-2'>샘플레이트 (Hz)</label>
                        <select 
                            value={store.sampleRate}
                            onChange={(e) => store.setSampleRate(Number(e.target.value))}
                            className='w-full border px-3 py-2 rounded'
                        >
                            {[8000, 16000, 22050, 44100, 48000].map((rate) => (
                                <option key={rate} value={rate}>
                                    {rate.toLocaleString()} Hz
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className='w-[30%]'>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">음성 종료 지연시간 (ms)</label>
                        <input
                            type="number"
                            min={500}
                            max={5000}
                            value={store.silenceTimeout}
                            onChange={(e) => store.setSilenceTimeout(Number(e.target.value))}
                            className="w-full border px-3 py-2 rounded"
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='block text-sm font-semibold mb-2'>마이크 플러그인</label>
                        <div className='flex items-center'>
                            <input 
                                type="checkbox"
                                checked={store.noiseSuppression}
                                onChange={(e) => store.setNoiseSuppression(e.target.checked)}
                                className='mr-2'
                            />
                            <span>배경 소음 감소 활성화</span>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <label className='flex items-center gap-2'>
                            <input 
                                type='checkbox'
                                checked={store.echoCancellation}
                                onChange={(e) => store.setEchoCancellation(e.target.checked)}
                            />
                            에코 제거
                        </label>
                    </div>
                    <div className='mb-4'>
                        <label className='flex items-center gap-2'>
                            <input 
                                type='checkbox'
                                checked={store.useVAD}
                                onChange={(e) => store.setVAD(e.target.checked)}
                                className='h-4 w-4'
                            />
                            자동 음성 감지 (VAD)
                        </label>
                    </div>
                </div>

                <div className='flex justify-end self-end gap-3 w-0 h-[40px] text-[15px]'>
                    <button
                        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                        onClick={handleSave}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        저장
                    </button>
                    <button
                        className='px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
                        onClick={onClose}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        취소
                    </button>
                </div>
            </motion.div>
        </div>
    )
}