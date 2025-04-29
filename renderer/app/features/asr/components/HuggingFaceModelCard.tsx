// app/components/HuggingFaceModelCard.tsx
'use client'

import { HuggingFaceModel, generateModelDescription } from '@/app/features/asr/utils/huggingFaceAPI'

interface HuggingFaceModelCardProps {
    model: HuggingFaceModel
    onSelect: (model: HuggingFaceModel) => void
}

function formatNumber(num: number): string {
    return num.toLocaleString('en-US')
}

function getAvatarUrl(model: HuggingFaceModel): string {
    // 썸네일이 있으면 썸네일 사용, 없으면 HuggingFace 아이콘 사용
    return model.cardData?.thumbnail || "http://localhost:8000/static/icons/Transformer.svg"
}

export default function HuggingFaceModelCard({ model, onSelect }: HuggingFaceModelCardProps) {
    return (
        <div
            className='bg-white border rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer'
            onClick={() => onSelect(model)}
        >
            {model.cardData?.thumbnail && (
                <img
                    src={model.cardData.thumbnail}
                    alt='Model Preview'
                    className='w-full h-32 object-cover'
                />
            )}
            <div className='p-4'>
                {/* 모델 이름 + 아이콘 */}
                <div className='flex items-center gap-2 mb-1'>
                    <img 
                        src={getAvatarUrl(model)}
                        alt="Avartar"
                        className='h-5 w-5 rounded-full'
                    />
                    <p className='font-semibold text-black text-base truncate'>
                        {model.cardData?.pretty_name || model.id}
                    </p>
                </div>

                {/* 설명 */}
                <p className='text-xs text-gray-500 line-clamp-2'>
                {model.cardData?.description || generateModelDescription(model)}
                </p>

                {/* 좋아요 / 다운로드 수 */}
                <div className='flex gap-4 text-[10px] text-gray-400 mt-3'>
                    <span>👍 {formatNumber(model.likes)}</span>
                    <span>⬇️ {formatNumber(model.downloads)}</span>
                </div>
            </div>
        </div>
    )
}
