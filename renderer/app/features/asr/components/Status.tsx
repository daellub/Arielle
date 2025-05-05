// app/features/asr/components/Status.tsx
'use client'

import axios from 'axios'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from '@/app/components/ui/tooltip'

import { Layers, HelpCircle } from 'lucide-react'
import { useMicStore } from '@/app/features/asr/store/useMicStore'
import { useSystemStatusStore } from '../store/useSystemStatusStore'
import { useState, useEffect } from 'react'

interface StatusItem {
    label: string
    active: boolean
    type: 'db' | 'model' | 'mic' | 'hardware'
}

interface DatabaseInfo {
    db_name: string
    tables: string[]
}

export default function SystemStatus() {
    const databaseActive = useSystemStatusStore((s) => s.status.databaseActive)
    const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
    const modelActive = useSystemStatusStore((s) => s.status.modelActive)
    const modelInfo = useSystemStatusStore((s) => s.status.modelInfo)
    const micStatus = useMicStore((s) => s.recordStatus)
    const hardwareInfo = useSystemStatusStore((s) => s.status.hardwareInfo)
    const setHardwareInfo = useSystemStatusStore((s) => s.setHardwareInfo)


    useEffect(() => {
        const fetchDbInfo = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/asr/db/info')
                setDatabaseInfo(res.data)
            } catch (e) {
                console.error('DB 정보 가져오기 실패:', e)
            }
        }
        fetchDbInfo()
    }, [])
    
    const statusItems: StatusItem[] = [
        { 
            label: databaseActive ? '데이터베이스 연결됨' : '데이터베이스 연결 실패',
            active: databaseActive,
            type: 'db'
        },
        {
            label: modelActive ? 'ASR 모델 정상 작동 중' : 'ASR 모델 미로드',
            active: modelActive,
            type: 'model'
        },
        {
            label:
                micStatus === 'ready' || micStatus === 'input'
                    ? '마이크 인식 시스템 작동 중'
                    : micStatus === 'unknown'
                    ? '마이크 미선택'
                    : '마이크 감지 실패',
            active: micStatus === 'ready' || micStatus === 'input',
            type: 'mic',
        },
        { label: '하드웨어 정상 작동 중', active: true, type: 'hardware' },
    ]

    return (
        <div className="bg-white shadow-md rounded-[32px] p-5 w-[260px] h-[320px] max-h-[320px] mt-5">
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className='flex items-center gap-3'>
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                        <Layers className="w-6 h-6" />
                    </div>
                </div>
                <span className="text-base text-[17px] text-black">Status</span>
            </div>

            {/* 상태 리스트 */} 
            <div className="space-y-7 text-sm text-black">
                {statusItems.map((item, idx) => (
                    <div key={idx} className='flex items-center'>
                        <span 
                            className={`w-3 aspect-square rounded-full mr-2 ${
                                item.active ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                        />
                        <div className="flex items-center justify-end w-full gap-2">
                            <span className="text-[15px] font-omyu_pretty text-right">
                                {item.label}
                            </span>

                            {item.type === 'db' && item.active && databaseInfo && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help">
                                                <HelpCircle className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[240px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                            <div className="space-y-2 text-xs text-zinc-800">
                                                <div className="font-semibold text-sm">📦 데이터베이스</div>
                                                <p className="text-[11px] text-zinc-400 mb-1">데이터베이스 이름</p>
                                                <span className="px-2 py-0.5 rounded bg-zinc-300 text-[10px] text-zinc-800">
                                                    {databaseInfo.db_name}
                                                </span>
                                                <p className="text-[11px] text-zinc-400 mt-2 mb-1">테이블 목록</p>
                                                <ul className="list-disc list-inside pl-1 space-y-0.5">
                                                    {databaseInfo.tables.map((table) => (
                                                        <li key={table} className="text-[11px] font-mono text-zinc-700">
                                                            {table}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {item.type === 'model' && item.active && modelInfo && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help">
                                                <HelpCircle className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[240px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                            <div className="space-y-2 text-xs text-zinc-800">
                                                <div className="font-semibold text-sm">🧠 ASR 모델</div>
                                                <div>
                                                    <span className="text-zinc-400">모델 이름: </span>
                                                    <span className="font-mono">{modelInfo.name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400">프레임워크: </span>
                                                    <span className="font-mono">{modelInfo.framework}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400">디바이스: </span>
                                                    <span className="font-mono">{modelInfo.device}</span>
                                                </div>
                                                {modelInfo.created_at && (
                                                    <div>
                                                        <span className="text-zinc-400">모델 생성시간: </span>
                                                        <span className="font-mono">{modelInfo.created_at}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {item.type === 'mic' && item.active && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help">
                                                <HelpCircle className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[240px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                            <div className="space-y-2 text-xs text-zinc-800">
                                                <div className="font-semibold text-sm">🎙 마이크 상태</div>
                                        
                                                <div>
                                                    <span className="text-zinc-400">선택된 마이크: </span>
                                                    <span className="font-mono">
                                                        {useMicStore.getState().deviceName || '선택되지 않음'}
                                                    </span>
                                                </div>
                                        
                                                <div>
                                                    <span className="text-zinc-400">노이즈 제거: </span>
                                                    <span className="font-mono">
                                                        {useMicStore.getState().noiseSuppression ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                        
                                                <div>
                                                    <span className="text-zinc-400">에코 제거: </span>
                                                    <span className="font-mono">
                                                        {useMicStore.getState().echoCancellation ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                        
                                                <div>
                                                    <span className="text-zinc-400">샘플레이트: </span>
                                                    <span className="font-mono">
                                                        {useMicStore.getState().sampleRate} Hz
                                                    </span>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {item.type === 'hardware' && item.active && hardwareInfo && (
                                <TooltipProvider>
                                    <Tooltip onOpenChange={(open) => {
                                        if (open) {
                                            axios.get('http://localhost:8000/api/hardware/info')
                                            .then((res) => setHardwareInfo(res.data))
                                            .catch((err) => console.error('하드웨어 정보 가져오기 실패:', err))
                                        }
                                    }}>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help">
                                                <HelpCircle className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[240px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                            {hardwareInfo ? (
                                                <div className="space-y-2 text-xs text-zinc-800">
                                                    <div className="font-semibold text-sm">🖥 시스템 사양</div>
                                                    <div>🧠 CPU: <span className="font-mono">{hardwareInfo.cpu}</span></div>
                                                    <div>📊 CPU 사용률: <span className="font-mono">{hardwareInfo.cpu_usage}</span></div>
                                                    <div>💾 RAM: <span className="font-mono">{hardwareInfo.ram.total}</span> / 사용률 {hardwareInfo.ram.used_percent}</div>
                                                    <div>📂 디스크: <span className="font-mono">{hardwareInfo.disk.total}</span> / 사용률 {hardwareInfo.disk.used_percent}</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400">불러오는 중...</span>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}