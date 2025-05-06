// app/translate/features/components/TranslateActionPanel.tsx
'use client'

import React from 'react'

export default function TranslateActionPanel() {
    return (
        <div className="mt-6 w-full flex justify-between items-center gap-4 p-4 rounded-xl border border-white/20 bg-white/20 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse">''</span>
                        마지막 번역 시각: 2025.05.07 00:05:12
                    </div>
                    <label className="text-sm text-gray-600">번역 대상 언어</label>
                    <select className="px-3 py-1.5 rounded-md bg-white/60 text-sm shadow-sm focus:outline-none">
                        <option value="en">영어</option>
                        <option value="ja">일본어</option>
                        <option value="zh">중국어</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="px-4 py-1.5 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white shadow">
                    재번역
                </button>
                <button className="px-4 py-1.5 text-sm rounded-md bg-white/80 hover:bg-white text-gray-700 shadow border">
                    복사
                </button>
            </div>
        </div>
    )
}
