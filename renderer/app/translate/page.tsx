// app/translate/page.tsx
'use client'

import { Languages } from 'lucide-react'
import Sidebar from '@/app/components/ui/Sidebar'
import TranslatePanel from '@/app/translate/features/components/TranslatePanel'
import TranslateActionPanel from '@/app/translate/features/components/TranslateActionPanel'
import TranslationHistoryList from './features/components/TranslateHistoryPanel'

export default function TranslatePage() {
    return (
        <main className="flex bg-white min-h-screen">
            <Sidebar />
            <div className="pt-8 px-20 pb-20 space-y-10 w-full">
                <div className="flex items-center gap-4">
                    <Languages className="w-10 h-10 text-blue-400" />
                    <h1 className="text-3xl font-bold text-black">Translate</h1>
                </div>
    
                <TranslatePanel />
                <TranslateActionPanel />
                <TranslationHistoryList />
            </div>
        </main>
    )
}

