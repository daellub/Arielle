// app/asr/features/components/Status.tsx
'use client'

import axios from 'axios'
import React, { JSX, useCallback, useEffect, useMemo, useRef } from 'react'
import { Layers, HelpCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/app/components/ui/tooltip'

import { useMicStore } from '@/app/asr/features/store/useMicStore'
import { useSystemStatusStore } from '@/app/asr/features/store/useSystemStatusStore'

type StatusKind = 'db' | 'model' | 'mic' | 'hardware'
interface StatusItem {
    label: string
    active: boolean
    type: StatusKind
}
interface DatabaseInfo {
    db_name: string
    tables: string[]
}

function Skeleton({ className = '' }: { className?: string }): JSX.Element {
    return <div className={`animate-pulse rounded-md bg-zinc-200/70 ${className}`} />;
}

const Dot = ({ on }: { on: boolean }) => (
    <motion.span
        initial={false}
        animate={{
            backgroundColor: on ? 'rgb(52,211,153)' : 'rgb(244,63,94)',
            boxShadow: on
                ? '0 0 0 6px rgba(16,185,129,0.10)'
                : '0 0 0 6px rgba(244,63,94,0.08)',
            scale: on ? 1.05 : 1.0,
        }} 
        transition={{ duration: 0.2 }}
        className='inline-block mr-2 w-2.5 h-2.5 rounded-full'
        aria-hidden
    />
)

const RowWrap = React.memo(function RowWrap({
    children,
}: React.PropsWithChildren) {
    return (
        <div className='flex items-center justify-between gap-2'>
            {children}
        </div>
    )
})

export default function SystemStatus() {
    // 상태 정보
    const databaseActive = useSystemStatusStore((s) => s.status.databaseActive)
    const modelActive = useSystemStatusStore((s) => s.status.modelActive)
    const modelInfo = useSystemStatusStore((s) => s.status.modelInfo)

    const micStatus = useMicStore((s) => s.recordStatus)
    const micDeviceName = useMicStore((s) => s.deviceName)
    const micNoiseSuppression = useMicStore((s) => s.noiseSuppression)
    const micEchoCancellation = useMicStore((s) => s.echoCancellation)
    const micSampleRate = useMicStore((s) => s.sampleRate)

    const hardwareInfo = useSystemStatusStore((s) => s.status.hardwareInfo)
    const setHardwareInfo = useSystemStatusStore((s) => s.setHardwareInfo)

    // 로컬 상태 정보
    const [databaseInfo, setDatabaseInfo] = React.useState<DatabaseInfo | null>(null)
    const hwFetchingRef = useRef(false)
    const hwLastFetchRef = useRef<number>(0)

    // 마이크 상태 정보
    const micActive = micStatus === 'ready' || micStatus === 'input'
    const micLabel = useMemo(() => {
        if (micStatus === 'ready' || micStatus === 'input') return '마이크 인식 시스템 작동 중'
        if (micStatus === 'unknown') return '마이크 미선택'
        return '마이크 감지 실패'
    }, [micActive, micStatus])

    // 상태 정보 메모
    const statusItems: StatusItem[] = useMemo(
        () => [
            {
                label: databaseActive ? '데이터베이스 연결됨' : '데이터베이스 연결 실패',
                active: databaseActive,
                type: 'db' as const,
            },
            {
                label: modelActive ? 'ASR 모델 정상 작동 중' : 'ASR 모델 미로드',
                active: modelActive,
                type: 'model' as const,
            },
            {
                label: micLabel,
                active: micActive,
                type: 'mic' as const,
            },
            {
                label: '하드웨어 정상 작동 중',
                active: true,
                type: 'hardware' as const,
            },
        ],
        [databaseActive, modelActive, micLabel, micActive]
    )

    // DB 정보
    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/asr/db/info')
                const filteredTables = Array.isArray(res?.data?.tables)
                    ? res.data.tables.filter((t: string) => t?.startsWith?.('asr'))
                    : []
                if (mounted) setDatabaseInfo({ db_name: res?.data?.db_name ?? '-', tables: filteredTables })
            } catch (e) {
                console.error('DB 정보 가져오기 실패:', e)
            }
        })()
        return () => {
            mounted = false
        }
    }, [])

    // 하드웨어 정보 (5초 주기)
    const fetchHardware = useCallback(async () => {
        const now = Date.now()
        if (hwFetchingRef.current) return
        if (now - hwLastFetchRef.current < 5000 && hardwareInfo) return

        hwFetchingRef.current = true
        try {
            const res = await axios.get('http://localhost:8000/api/hardware/info')
            setHardwareInfo(res.data)
            hwLastFetchRef.current = Date.now()
        } catch (err) {
            console.error('하드웨어 정보 가져오기 실패:', err)
        } finally {
            hwFetchingRef.current = false
        }
    }, [hardwareInfo, setHardwareInfo])

    return (
        <TooltipProvider delayDuration={120}>
            <div
                className='w-[260px] h-[320px] mt-5 
                    bg-white/55 backdrop-blur-md border border-white/10 
                    shadow-[0_6px_20px_rgba(0,0,0,0.10)] 
                    rounded-2xl px-6 py-6 transition-all overflow-hidden'
            >
                {/* 헤더 */}
                <div className='flex items-center justify-between mb-6'>
                    <div className='w-12 h-12 bg-black rounded-full flex items-center justify-center text-white shadow-md'>
                        <Layers className='w-6 h-6' />
                    </div>
                    <span className='text-[17px] text-black font-medium'>Status</span>
                </div>

                {/* 상태 리스트 */} 
                <div className="space-y-6 text-sm text-black">
                    {statusItems.map((item, idx) => (
                        <RowWrap key={idx}>
                            <div className='flex items-center'>
                                <Dot on={item.active} />
                                <div className="min-h-[20px] mx-2">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={item.label}
                                            initial={{ opacity: 0, y: 2 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -2 }}
                                            transition={{ duration: 0.18 }}
                                            className="text-[15px] font-omyu_pretty text-right leading-tight block"
                                            aria-live="polite"
                                        >
                                            {item.label}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* 툴팁 */}
                            {item.type === 'db' && item.active && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className='cursor-help p-1 rounded-md hover:bg-zinc-100' aria-label='DB 정보'>
                                            <HelpCircle className='w-4 h-4 text-zinc-400' />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[260px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                        {!databaseInfo ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-40" />
                                                <div className="space-y-1">
                                                <Skeleton className="h-3 w-full" />
                                                <Skeleton className="h-3 w-[85%]" />
                                                <Skeleton className="h-3 w-[60%]" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 text-xs text-zinc-800">
                                                <div className="font-semibold text-sm">📦 데이터베이스</div>
                                                <p className="text-[11px] text-zinc-400 mb-1">데이터베이스 이름</p>
                                                <span className="px-2 py-0.5 rounded bg-zinc-200/70 text-[10px] text-zinc-800">
                                                    {databaseInfo.db_name}
                                                </span>
                                                <p className="text-[11px] text-zinc-400 mt-2 mb-1">테이블 목록</p>
                                                <ul className="list-disc list-inside pl-1 space-y-0.5">
                                                    {databaseInfo.tables.length ? (
                                                        databaseInfo.tables.map((t) => (
                                                        <li key={t} className="text-[11px] text-zinc-700">
                                                            {t}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-[11px] text-zinc-400">비어 있음</li>
                                                )}
                                                </ul>
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {item.type === 'model' && item.active && modelInfo && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="cursor-help p-1 rounded-md hover:bg-zinc-100" aria-label="모델 정보">
                                            <HelpCircle className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[260px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                        {!modelInfo ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-28" />
                                                <Skeleton className="h-3 w-36" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 text-xs text-zinc-800">
                                                <div className="font-semibold text-sm">🧠 ASR 모델</div>
                                                <div><span className="text-zinc-400">모델 이름: </span><span>{modelInfo.name}</span></div>
                                                <div><span className="text-zinc-400">프레임워크: </span><span>{modelInfo.framework}</span></div>
                                                <div><span className="text-zinc-400">디바이스: </span><span>{modelInfo.device}</span></div>
                                                {modelInfo.created_at && (
                                                    <div><span className="text-zinc-400">모델 생성시간: </span><span>{modelInfo.created_at}</span></div>
                                                )}
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {item.type === 'mic' && item.active && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="cursor-help p-1 rounded-md hover:bg-zinc-100" aria-label="마이크 정보">
                                            <HelpCircle className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[260px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                        <div className="space-y-1.5 text-xs text-zinc-800">
                                            <div className="font-semibold text-sm">🎙 마이크 상태</div>
                                            <div><span className="text-zinc-400">선택된 마이크: </span><span>{micDeviceName || '선택되지 않음'}</span></div>
                                            <div><span className="text-zinc-400">노이즈 제거: </span><span>{micNoiseSuppression ? 'ON' : 'OFF'}</span></div>
                                            <div><span className="text-zinc-400">에코 제거: </span><span>{micEchoCancellation ? 'ON' : 'OFF'}</span></div>
                                            <div><span className="text-zinc-400">샘플레이트: </span><span>{micSampleRate} Hz</span></div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {item.type === 'hardware' && (
                                <Tooltip onOpenChange={(open) => { if (open) void fetchHardware() }}>
                                    <TooltipTrigger asChild>
                                        <button className="cursor-help p-1 rounded-md hover:bg-zinc-100" aria-label="하드웨어 정보">
                                            <HelpCircle className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[260px] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl text-left">
                                        {!hardwareInfo ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-28" />
                                                <Skeleton className="h-3 w-40" />
                                                <Skeleton className="h-3 w-48" />
                                                <Skeleton className="h-3 w-44" />
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 text-xs text-zinc-800">
                                                <div className="font-semibold text-sm">🖥 시스템 사양</div>
                                                <div>🧠 CPU: <span>{hardwareInfo.cpu}</span></div>
                                                <div>📊 CPU 사용률: <span>{hardwareInfo.cpu_usage}</span></div>
                                                <div>💾 RAM: <span>{hardwareInfo.ram?.total}</span> / 사용률 {hardwareInfo.ram?.used_percent}</div>
                                                <div>📂 디스크: <span>{hardwareInfo.disk?.total}</span> / 사용률 {hardwareInfo.disk?.used_percent}</div>
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </RowWrap>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    )
}