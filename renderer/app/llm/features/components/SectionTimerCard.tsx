// app/llm/features/components/SectionTimerCard.tsx
import { Clock } from 'lucide-react'

export default function SessionTimerCard() {
    return (
        <div className="w-[260px] p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-sm text-white flex items-center justify-between">
            <div className="text-[13px] text-white/70 flex items-center gap-2">
                <Clock className='w-5 h-5 text-indigo-200' />
                세션 시간
            </div>
            <div className="text-white font-semibold text-[13px]">2분 31초</div>
        </div>
    )
}