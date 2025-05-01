// app/features/asr/components/Status.tsx
'use client'

import { Layers, ChevronDown } from 'lucide-react'

interface StatusItem {
    label: string
    active: boolean
}

const statusItems: StatusItem[] = [
    { label: '데이터베이스 정상 작동 중', active: true },
    { label: 'ASR 모델 정상 작동 중', active: true },
    { label: '마이크 인식 시스템 작동 중', active: true },
    { label: '하드웨어 정상 작동 중', active: false },
]

export default function SystemStatus() {
    return (
        <div className="bg-white shadow-md rounded-[32px] p-5 w-[260px] h-[320px] mt-5">
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className='flex items-center gap-3'>
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
                        <Layers className="w-6 h-6" />
                    </div>
                    <ChevronDown className="text-black w-4 h-4" />
                </div>
                <span className="text-base text-black">Status</span>
            </div>

            {/* 상태 리스트 */} 
            <div className="space-y-7 text-sm text-black">
                {statusItems.map((item, idx) => (
                    <div key={idx} className='flex items-center'>
                        <span 
                            className={`w-3 h-3 rounded-full mr-2 ${
                                item.active ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                        />
                        <span className='text-[15px] font-omyu_pretty text-right w-full'>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}