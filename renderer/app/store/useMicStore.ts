// app/store/useMicStore.ts
import { create } from 'zustand'

interface MicState {
    deviceId?: string
    deviceName: string
    recordStatus: 'ready' | 'input' | 'error' | 'unknown'
    processStatus: 'ready' | 'notready' | 'error'
    inputThreshold: number // 입력 임계값
    sampleRate: number // 샘플레이트

    noiseSuppression: boolean // 노이즈 감소 기능
    echoCancellation: boolean // 에코 감소 기능
    useVAD: boolean // VAD: Voice Activity Detection 사용 여부
    volumeGain: number; // 볼륨 증폭 비율
    silenceTimeout: number; // 음성 종료 지연 시간 (ms)

    setDevice: (id?: string, name?: string) => void
    setRecordStatus: (status: MicState['recordStatus']) => void
    setProcessStatus: (status: MicState['processStatus']) => void
    setThreshold: (value: number) => void
    setSampleRate: (value: number) => void
    setNoiseSuppression: (enabled: boolean) => void
    setEchoCancellation: (enabled: boolean) => void
    setVAD: (value: boolean) => void
    setVolumeGain: (value: number) => void
    setSilenceTimeout: (value: number) => void
}

export const useMicStore = create<MicState>((set) => ({
    deviceId: undefined,
    deviceName: '기본 마이크',
    recordStatus: 'unknown',
    processStatus: 'notready',
    inputThreshold: 80,
    sampleRate: 16000,

    noiseSuppression: false,
    echoCancellation: false,
    useVAD: false,
    volumeGain: 100,
    silenceTimeout: 1000,

    setDevice: (id, name) => set({ deviceId: id, deviceName: name }),
    setRecordStatus: (status) => set({ recordStatus: status }),
    setProcessStatus: (status) => set({ processStatus: status }),
    setThreshold: (value) => set({ inputThreshold: value }),
    setSampleRate: (value) => set({ sampleRate: value }),
    setNoiseSuppression: (enabled) => set({ noiseSuppression: enabled }),
    setEchoCancellation: (enabled) => set({ echoCancellation: enabled }),
    setVAD: (value: boolean) => set({ useVAD: value }),
    setVolumeGain: (value: number) => set({ volumeGain: value }),
    setSilenceTimeout: (value: number) => set({ silenceTimeout: value })
}))