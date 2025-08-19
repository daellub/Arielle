// app/asr/features/components/Settings.tsx
'use client'

import clsx from 'clsx'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { motion } from 'motion/react'
import { shallow } from 'zustand/shallow'
import { useMicInputLevel } from '@/app/asr/features/hooks/useMicInputLevel'
import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import WaveformCanvas from '@/app/asr/features/components/WaveformCanvas'
import { useMicVisualizer } from '@/app/asr/features/hooks/useMicVisualizer'

interface Props {
    onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
    const {
        deviceId: savedDeviceId,
        deviceName: savedDeviceName,
        setDevice,

        volumeGain, setVolumeGain,
        inputThreshold, setThreshold,
        sampleRate, setSampleRate,
        noiseSuppression, setNoiseSuppression,
        echoCancellation, setEchoCancellation,
        useVAD, setVAD,
        silenceTimeout, setSilenceTimeout,
    } = useMicStore(
        (s) => ({
            deviceId: s.deviceId,
            deviceName: s.deviceName,
            setDevice: s.setDevice,
            volumeGain: s.volumeGain,
            setVolumeGain: s.setVolumeGain,
            inputThreshold: s.inputThreshold,
            setThreshold: s.setThreshold,
            sampleRate: s.sampleRate,
            setSampleRate: s.setSampleRate,
            noiseSuppression: s.noiseSuppression,
            setNoiseSuppression: s.setNoiseSuppression,
            echoCancellation: s.echoCancellation,
            setEchoCancellation: s.setEchoCancellation,
            useVAD: s.useVAD,
            setVAD: s.setVAD,
            silenceTimeout: s.silenceTimeout,
            setSilenceTimeout: s.setSilenceTimeout,
        }),
        shallow
    )

    const notify = useNotificationStore((s) => s.show)

    // 로컬 상태
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
    const [testing, setTesting] = useState(false);
    const [loadingDevices, setLoadingDevices] = useState(false)

    const levelRef = React.useRef(0)

    const {
        analyser,
        monitoring,
        setMonitoring,
        monitorGain,
        setMonitorGain,
        sampleRate: ctxSampleRate,
    } = useMicVisualizer({
        deviceId: selectedDeviceId,
        enabled: testing,
        noiseSuppression,
        echoCancellation,
    })

    // 마이크 레벨
    const inputLevel = useMicInputLevel(testing ? selectedDeviceId : undefined)

    // 볼륨 조정 및 임계값
    const adjustedLevel = useMemo(() => {
        return Math.min(100, Math.max(0, inputLevel * 100 * (volumeGain / 100)))
    }, [inputLevel, volumeGain])

    const isAboveThreshold = useMemo(
        () => adjustedLevel >= inputThreshold,
        [adjustedLevel, inputThreshold]
    )

    const smoothLevel = React.useMemo(() => {
        levelRef.current = levelRef.current * 0.8 + adjustedLevel * 0.2
        return levelRef.current
    }, [adjustedLevel])

    // 디바이스 탐색
    const enumerateAudioInputs = useCallback(async () => {
        setLoadingDevices(true)
        try {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true })
            } catch {
                // 무시
            }

            const devs = await navigator.mediaDevices.enumerateDevices()
            const inputs = devs.filter((d) => d.kind === 'audioinput')
            setDevices(inputs)

            if (inputs.length > 0) {
                if (savedDeviceId && inputs.some((d) => d.deviceId === savedDeviceId)) {
                    setSelectedDeviceId(savedDeviceId)
                } else {
                    setSelectedDeviceId(inputs[0].deviceId)
                }
            } else {
                setSelectedDeviceId(undefined)
            }
        } catch (e) {
            console.error('오디오 입력 장치 탐색 실패:', e)
            setDevices([])
            setSelectedDeviceId(undefined)
        } finally {
            setLoadingDevices(false)
        }
    }, [savedDeviceId])

    useEffect(() => {
        enumerateAudioInputs()
    }, [enumerateAudioInputs])

    // 저장
    const handleSave = useCallback(() => {
        if (!selectedDeviceId) {
            setDevice(undefined, '사용 안함')
        } else {
            const selected = devices.find((d) => d.deviceId === selectedDeviceId)
            setDevice(selected?.deviceId, selected?.label || '이름 없는 장치')
        }
        notify('설정이 저장되었습니다.', 'info')
        onClose()
    }, [devices, notify, onClose, selectedDeviceId, setDevice])

    // 컴포넌트
    const DeviceRow = (
        <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-gray-700">입력 장치 선택</label>

            <div className="flex gap-2">
                <select
                    className="w-[590px] border px-3 py-2 rounded bg-white"
                    value={selectedDeviceId ?? ''}
                    onChange={(e) => setSelectedDeviceId(e.target.value || undefined)}
                    aria-label="오디오 입력 장치"
                    disabled={loadingDevices}
                >
                <option value="">🎙 마이크 사용 안함</option>
                {devices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `이름 없는 장치 #${idx + 1}`}
                    </option>
                ))}
                </select>

                <button
                    type="button"
                    onClick={enumerateAudioInputs}
                    className="px-3 py-2 rounded border bg-white hover:bg-gray-50 text-gray-700 text-sm"
                    aria-label="장치 새로고침"
                    disabled={loadingDevices}
                >
                    {loadingDevices ? '새로고침…' : '새로고침'}
                </button>
            </div>

            <div className="flex items-center gap-3 mt-3">
                <button
                    className="px-3 py-2 bg-gray-900 text-white rounded hover:bg-black/85 text-sm min-w-[120px]"
                    onClick={() => setTesting((v) => !v)}
                >
                    {testing ? '테스트 종료' : '마이크 테스트'}
                </button>

                {testing && (
                    <div className="mt-3 w-full flex items-start gap-4">
                        {/* 좌: 파형 */}
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">
                                미리보기 파형 {ctxSampleRate ? `· ${ctxSampleRate} Hz` : ''}
                            </div>
                            <div className="bg-black rounded-md p-2">
                                <WaveformCanvas
                                    analyser={analyser}
                                    width={300}
                                    height={84}
                                    fps={60}
                                    sampleStep={2}
                                    vpad={3}
                                />
                            </div>
                        </div>

                        {/* 우: 모니터링 컨트롤 */}
                        <div className="w-[220px] shrink-0 space-y-2">
                            <label className="flex items-center justify-between text-sm text-gray-800">
                                <span>오디오 모니터링</span>
                                <button
                                    type="button"
                                    onClick={() => setMonitoring(!monitoring)}
                                    className={clsx(
                                        'px-3 py-1.5 rounded text-white text-xs',
                                        monitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-black'
                                    )}
                                >
                                    {monitoring ? '끄기' : '켜기'}
                                </button>
                            </label>

                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>모니터 볼륨</span>
                                    <span className="text-gray-700 font-medium">{Math.round(monitorGain * 100)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Math.round(monitorGain * 100)}
                                    onChange={(e) => setMonitorGain(Number(e.target.value) / 100)}
                                    className="w-full accent-blue-600"
                                    aria-label="모니터 볼륨"
                                    disabled={!monitoring}
                                />
                            </div>

                            <div className="text-[11px] text-gray-500 leading-relaxed">
                                모니터링은 현재 입력을 <b>스피커로 재생</b>합니다. 피드백/하울링을 피하려면
                                <b> 헤드폰</b> 사용을 권장해요. (에코 제거를 켠 상태면 덜 들릴 수 있어요)
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    const VolumeRow = (
        <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700">마이크 볼륨 조절</label>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>0</span>
                <span className="text-gray-700 font-medium">{volumeGain}</span>
                <span>100</span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={volumeGain}
                onChange={(e) => setVolumeGain(Number(e.target.value))}
                className="w-full accent-blue-600"
                aria-label="마이크 볼륨"
            />
        </div>
    )

    const ThresholdRow = (
        <div className="mb-5">
            <div className="flex items-center gap-3">
                <label className="block text-sm font-semibold text-gray-700">입력 임계값 (%)</label>
                    {useVAD && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                            VAD 활성화 상태 — 임계값 수동조정 비활성
                        </span>
                    )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>10</span>
                <span className="text-gray-700 font-medium">{inputThreshold}</span>
                <span>100</span>
            </div>
            <input
                type="range"
                min={10}
                max={100}
                value={inputThreshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                disabled={useVAD}
                className="w-full accent-blue-600 disabled:opacity-50"
                aria-label="입력 임계값"
            />
        </div>
    )

    const SampleRateRow = (
        <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-gray-700">샘플레이트 (Hz)</label>
            <select
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded bg-white"
                aria-label="샘플레이트"
            >
                {[8000, 16000, 22050, 44100, 48000].map((rate) => (
                    <option key={rate} value={rate}>
                        {rate.toLocaleString()} Hz
                    </option>
                ))}
            </select>
        </div>
    )

    const RightOptions = (
        <>
            <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">음성 종료 지연시간 (ms)</label>
                <input
                    type="number"
                    min={500}
                    max={5000}
                    value={silenceTimeout}
                    onChange={(e) => setSilenceTimeout(Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded bg-white"
                    aria-label="음성 종료 지연시간"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">마이크 플러그인</label>

                <label className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                        type="checkbox"
                        checked={noiseSuppression}
                        onChange={(e) => setNoiseSuppression(e.target.checked)}
                        className="h-4 w-4"
                    />
                    배경 소음 감소
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-800 mt-2">
                    <input
                        type="checkbox"
                        checked={echoCancellation}
                        onChange={(e) => setEchoCancellation(e.target.checked)}
                        className="h-4 w-4"
                    />
                    에코 제거
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-800 mt-2">
                    <input
                        type="checkbox"
                        checked={useVAD}
                        onChange={(e) => setVAD(e.target.checked)}
                        className="h-4 w-4"
                    />
                    자동 음성 감지 (VAD)
                </label>
            </div>
        </>
    )

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        bg-white w-[1100px] h-[650px] p-8 rounded-2xl shadow-lg gap-8 flex z-[9999]'
            role='dialog'
            aria-modal='true'
            aria-label='ASR 환경 설정'
        >
            {/* 좌측 */}
            <div className='w-[70%]'>
                <h2 className='text-2xl font-bold mb-4 text-black'>⚙️ ASR 환경 설정</h2>
                
                {DeviceRow}
                {VolumeRow}
                {ThresholdRow}
                {SampleRateRow}
            </div>

            {/* 우측 */}
            <div className='w-[30%]'>
                {RightOptions}
            </div>

            {/* 하단 */}
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
    )
}