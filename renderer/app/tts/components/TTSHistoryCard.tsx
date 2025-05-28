// app/tts/components/TTSHistoryCard.tsx
'use client'

import styles from './TTSHistoryCard.module.css'

interface Props {
    text: string
    audioUrl: string
    timestamp: string
    onDelete?: () => void
    onDownload?: () => void
}

export default function TTSHistoryCard({ text, audioUrl, timestamp, onDelete, onDownload }: Props) {
    return (
        <div className={styles.card}>
            <p className="text-[#eee] font-medium">“{text}”</p>
            <audio controls className="w-full mt-2">
                <source src={audioUrl} type="audio/mpeg" />
            </audio>
            <div className="flex justify-between mt-3 text-sm text-gray-500">
                <span>{timestamp}</span>
                <div className="flex gap-2">
                    <button onClick={onDelete} className="hover:underline text-[#a56eff]">삭제</button>
                    <button onClick={onDownload} className="hover:underline text-[#a56eff]">다운로드</button>
                </div>
            </div>
        </div>
    )
}
