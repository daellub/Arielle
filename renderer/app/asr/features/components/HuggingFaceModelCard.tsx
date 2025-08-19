/** app/asr/features/components/HuggingFaceModelCard.tsx
 *  HuggingFace 모델 카드 컴포넌트
 *  모델의 썸네일, 이름, 설명, 좋아요/다운로드 수를 표시
 */
'use client'

import { HuggingFaceModel, generateModelDescription } from '@/app/asr/features/utils/huggingFaceAPI'
import React, { KeyboardEvent } from 'react'

interface HuggingFaceModelCardProps {
    model: HuggingFaceModel
    onSelect: (model: HuggingFaceModel) => void
}

function formatNumber(num?: number): string {
    return (num ?? 0).toLocaleString('en-US')
}

function getAvatarUrl(model: HuggingFaceModel): string {
    // 썸네일이 있으면 썸네일 사용, 없으면 HuggingFace 아이콘 사용
    return model.cardData?.thumbnail || "http://localhost:8000/static/icons/Transformer.svg"
}

export default function HuggingFaceModelCard({ model, onSelect }: HuggingFaceModelCardProps) {
    const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(model)
        }
    }

    return (
        <div
            className='bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer'
            onClick={() => onSelect(model)}
            role='button'
            tabIndex={0}
            onKeyDown={handleKey}
            aria-label={`모델 선택 ${model.cardData?.pretty_name || model.id}`}
        >
            {model.cardData?.thumbnail && (
                <img
                    src={model.cardData.thumbnail}
                    alt='Model Preview'
                    className='w-full h-32 object-cover'
                    loading='lazy'
                    referrerPolicy='no-referrer'
                />
            )}

            <div className='p-4'>
                {/* 모델 이름 + 아이콘 */}
                <div className='flex items-center gap-2 mb-1'>
                    <img 
                        src={getAvatarUrl(model)}
                        alt="Avartar"
                        className='h-5 w-5 rounded-full'
                        loading='lazy'
                        referrerPolicy='no-referrer'
                    />
                    <p className='font-semibold text-black text-base truncate' title={model.id}>
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
