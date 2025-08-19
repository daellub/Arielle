// app/providers.tsx
'use client'

import { ReactNode } from 'react'
import { DownloadProvider } from './asr/features/components/DownloadContext'
import Notification from '@/app/components/ui/Notification'
import RecordingStatusIndicator from '@/app/components/ui/RecordingStatusIndicator'
import MagicCircle from '@/app/ui/MagicCircle'

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <DownloadProvider>
            <MagicCircle />
            <RecordingStatusIndicator />
            <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
            <Notification />
        </DownloadProvider>
    )
}