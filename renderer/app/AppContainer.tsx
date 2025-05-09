// app/AppContainer.tsx
'use client'

import { useState } from 'react'
import Sidebar from './components/ui/Sidebar'
import HomePage from './pages/HomePage'
import ASRPage from './pages/ASRPage'
import TranslatePage from './pages/TranslatePage'

export default function AppContainer() {
    const [selectedTab, setSelectedTab] = useState('Home')

    return (
        <div className="flex bg-white">
            <Sidebar selected={selectedTab} onSelect={setSelectedTab} />
            <main className="transition-all duration-300">
                <div style={{ display: selectedTab === 'Home' ? 'block' : 'none' }}>
                    <HomePage />
                </div>
                <div style={{ display: selectedTab === 'ASR' ? 'block' : 'none' }}>
                    <ASRPage />
                </div>
                <div style={{ display: selectedTab === 'Translate' ? 'block' : 'none' }}>
                    <TranslatePage />
                </div>
            </main>
        </div>
    )
}
