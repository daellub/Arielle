// app/asr/features/components/Models.tsx
'use client'

import axios from 'axios'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import ModelPopup from '@/app/asr/features/components/ModelPopup'
import { useNotificationStore } from '@/app/store/useNotificationStore'
import { useSelectedModelStore } from '@/app/asr/features/store/useSelectedModelStore'
import { Model, ModelStatus } from '@/app/asr/features/types/Model'
import { Download } from 'lucide-react'
import { DownloadPanel } from './DownloadPanel'

// 레이턴시 파싱
const parseLatency = (latency: string | number | null | undefined): number => {
    if (typeof latency === 'number') return latency;
    if (typeof latency === 'string') {
        const num = parseFloat(latency.replace("ms", "").trim())
        return isNaN(num) ? 0 : num
    }
    return 0 // Fallback
};

const StatusBar = ({ status, latency }: { status: ModelStatus, latency: string }) => {
    const latencyNum = parseLatency(latency)
    const getColor = () => {
        if (status === 'loading') return '#318DEC';
        if (status === 'error') return '#C24568';
        if (status === 'idle') return '#B0BEC5';
        if (status === 'active') {
            if (latencyNum <= 1) return '#53EC31';
            if (latencyNum <= 3) return '#F28D54';
            return '#F44336';
        }
        return '#BDBDBD'
    }

    const getBarCount = () => {
        if (status === 'loading') return 3;
        if (status === 'error') return 3;
        if (status === 'idle') return 0;
        if (status === 'active') {
            if (latencyNum <= 1) return 3;
            if (latencyNum <= 3) return 2;
            return 1;
        }
        return 0;
    }

    const bars = Array.from({ length: 3}).map((_, i) => (
        <div
            key={i}
            className={clsx(
                'w-[3px] h-3 rounded-md transition-all duration-300',
                status === 'loading' && 'status-bar-dot'
            )}
            style={{
                backgroundColor: i < getBarCount() ? getColor() : '#E0E0E0',
                animationDelay: status === 'loading' ? `${i * 0.2}s` : '0s',
            }}
        />
    ))
    
    return <div className='flex space-x-[2px]'>{bars}</div>
}

const StatusIndicator = ({ status }: { status: ModelStatus }) => (
    <div className={clsx(
        'mx-[4px] w-2 h-2 rounded-full',
        status === 'active' ? 'animate-pulse bg-green-500' :
        status === 'error' ? 'bg-red-500' : 'bg-gray-400'
    )} />
);

interface Props {
    onOpenSettings: () => void
    onOpenAddModel: () => void
    onModelAdded?: () => void
    onOpenModelInfo: (model: Model) => void
    onRequestDelete: (model: Model) => void
    models: Model[]
    refreshModels: (context?: 'refresh' | 'add' | 'delete' | 'manual' | 'load' | 'unload') => void
}

export default function Models({ onOpenSettings, onOpenAddModel, onModelAdded, onOpenModelInfo, onRequestDelete, models, refreshModels }: Props) {
    const { selectedModel, setSelectedModel, clearSelectedModel } = useSelectedModelStore()
    const [menuOpen, setMenuOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; model?: Model } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [popupVisible, setPopupVisible] = useState(false)
    const [loadingModelId, setLoadingModelId] = useState<string | null>(null)
    const [isDownloadOpen, setDownloadOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const downloadBtnRef = useRef<HTMLButtonElement>(null)

    const notify = useNotificationStore((s) => s.show)

    const handleModelClick = (model: Model) => {
        setSelectedModel(model)
        setPopupVisible(true)
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setDownloadOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null)
        window.addEventListener("click", handleClickOutside)
        return () => window.removeEventListener("click", handleClickOutside);
    }, [])

    return (
        <>
            <section className={clsx(
                "relative w-full min-w-[300px] max-w-[300px] min-h-[665px] max-h-[665px] ml-[80px] mt-[20px] px-6 py-6",
                "bg-white/50 backdrop-blur-md border border-white/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)]",
                "rounded-2xl transition-all overflow-visible z-20"
            )}>
                <div className='flex items-center justify-between mb-4'>
                    <div className='relative' ref={panelRef}>
                        <div className='flex items-center gap-2'>
                            <h2 className="text-xl text-black font-MapoPeacefull">Models</h2>
                            <div className='relative inline-block'>
                                <button
                                    ref={downloadBtnRef}
                                    onClick={() => setDownloadOpen(true)}
                                    className='w-8 h-8 text-black rounded-full flex items-center justify-center hover:bg-gray-800 hover:text-white'
                                >
                                    <Download className='w-4 h-4' />
                                </button>

                                {isDownloadOpen && downloadBtnRef.current && (
                                    <div
                                        style={{
                                        position: 'absolute',
                                        top: downloadBtnRef.current.offsetTop + downloadBtnRef.current.offsetHeight + 8,
                                        left: downloadBtnRef.current.offsetLeft,
                                        zIndex: 9999
                                        }}
                                    >
                                        <DownloadPanel isOpen={isDownloadOpen} onClose={() => setDownloadOpen(false)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className='relative' ref={dropdownRef}>
                        <button
                            onClick={() => setMenuOpen(prev => !prev)}
                            className='p-1 rounded hover:bg-gray-100 transition'
                        >
                            <Image
                                src="/icons/Models/menu.svg"
                                alt="Menu"
                                width={15}
                                height={15}
                            />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className='absolute right-0 mt-2 w-[140px] bg-white border-gray-200 rounded-lg shadow-lg z-10'
                                >
                                    <button
                                        className='w-full text-left font-MapoPeacefull px-4 py-2 text-sm text-blue-400 hover:bg-gray-100 hover:rounded-lg flex items-center gap-x-2'
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onOpenAddModel()
                                        }}
                                    >
                                        <Image 
                                            src="/icons/Models/Dropdown/plus.svg"
                                            alt="Add Model"
                                            width={12}
                                            height={12}    
                                        />
                                        모델 추가
                                    </button>
                                    <button
                                        className="w-full text-left font-MapoPeacefull px-4 py-2 text-sm text-green-400 hover:bg-gray-100 hover:rounded-lg flex items-center gap-x-2"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            refreshModels('refresh')
                                        }}
                                    >
                                        <Image 
                                            src="/icons/Models/Dropdown/refresh.svg"
                                            alt="Refresh Models"
                                            width={12}
                                            height={12}    
                                        />
                                        새로고침
                                    </button>
                                    <button
                                        className="w-full text-left font-MapoPeacefull px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:rounded-lg flex items-center gap-x-2"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onOpenSettings()
                                        }}
                                    >
                                        <Image 
                                            src="/icons/Models/Dropdown/settings.svg"
                                            alt="Model Setting"
                                            width={12}
                                            height={12}    
                                        />
                                        설정
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                {models.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500 text-lg font-HakgyoansimWoojuR">
                        모델 디렉토리가 비어있습니다!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        <AnimatePresence>
                            {models.map((model, i) => (
                                <motion.div
                                    key={model.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }} // delay: i * 0.05 
                                    className={clsx(
                                        'flex flex-col p-3 pb-0 rounded-lg border cursor-pointer transition-all w-full',
                                        selectedModel?.name === model.name 
                                            ? 'border-gray-500 shadow-md scale-[1.02]' 
                                            : 'border-gray-300',
                                            model.status !== 'active' && 'opacity-70 scale-[0.98]',
                                            model.status === 'active' && 'border-green-400',
                                            model.status === 'loading' && 'border-blue-400',
                                            model.status === 'idle' && 'border-gray-300',
                                            model.status === 'error' && 'border-red-200',                   
                                    )}
                                    onClick={() => handleModelClick(model)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                    
                                        const rect = e.currentTarget.getBoundingClientRect()
                                    
                                        const x = e.clientX - rect.left
                                        const y = e.clientY - rect.top
                                    
                                        setContextMenu({ x, y, model })
                                    }}
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                        <Image 
                                            src={`http://localhost:8000${model.logo}`}  // 백엔드 URL
                                            alt="Model Logo"
                                            width={model.logo.includes("Meta.svg") ? 20 : 30}
                                            height={model.logo.includes("Meta.svg") ? 20 : 30}
                                            className={model.logo.includes("Meta.svg") ? "ml-1 mr-1" : ""}
                                        />
                                            <span className='text-2 text-black font-semibold ml-[-4px]'>{model.type}</span>
                                            <StatusBar status={model.status} latency={model.latency} />
                                        </div>
                                        <StatusIndicator status={model.status} />
                                    </div>
                                
                                    <div className='mx-1 text-sm'>
                                        <span className='font-omyu_pretty text-[14px] text-black'>{model.name}</span>
                                        <span className='font-omyu_pretty text-[14px] text-gray-500'> ({model.language})</span>
                                    </div>
                                
                                    {model.status === 'active' ? (
                                        <>
                                            <div>
                                                <div className='font-omyu_pretty text-[15px] text-gray-500'>On Time</div>
                                                <div className='mx-2 mt-[-6px]'>
                                                    <span className='font-omyu_pretty text-[14px] text-gray-500'>Loaded: {model.loadedTime ?? new Date().toLocaleString()}</span>
                                                </div>
                                            </div>
                                    
                                    
                                            <div className='border-t border-gray-300 w-full mt-1'></div>
                                    
                                            <div className='flex items-center'>
                                                <div className={clsx(
                                                    'flex items-center gap-1 p-1 rounded-lg',
                                                    model.status === 'active' ? 'bg-[#A6CCB7]': 'border-gray-300'
                                                )}>
                                                    <div className='p-1 bg-[#C3E0D2] rounded-[5px]'>
                                                        <Image
                                                            src='/icons/Models/library.svg'
                                                            alt='Framework'
                                                            width={10}
                                                            height={10}
                                                        />
                                                    </div>
                                                    <span className='text-[12px] text-black'>{model.framework}</span>
                                                </div>
                                            
                                                <div className='flex items-center gap-2 p-2'>
                                                    <div className='flex p-1 border border-gray-300 rounded-lg'>
                                                        <Image
                                                            src='/icons/Models/device.svg'
                                                            alt='Device'
                                                            width={10}
                                                            height={10}
                                                        />
                                                        <span className='text-[12px] text-black px-1'>{model.device}</span>
                                                    </div>
                                            
                                                    <div className='flex p-1 border border-gray-300 rounded-lg'>
                                                        <Image
                                                            src='/icons/Models/latency.svg'
                                                            alt='Latency'
                                                            width={10}
                                                            height={10}
                                                        />
                                                        <span className='text-[12px] text-black px-1'>{model.latency}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : model.status === 'loading' ? (
                                        <div className='flex items-center gap-2 px-2 py-2 text-[16px] text-blue-500 font-omyu_pretty'>
                                            <div className='w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate_loading' />
                                            Loading...
                                        </div>
                                    ) : (
                                        <div className='mb-2 px-2 py-2 text-[16px] text-gray-600 font-omyu_pretty'>
                                            {model.status ? (model.status === 'idle' ? 'Not Loaded' : model.status) : 'Not Available'}
                                    
                                        </div> 
                                    )}
                                    {contextMenu?.model?.id === model.id && (
                                        <div
                                            className="absolute z-50 bg-opacity-80 shadow-lg backdrop-blur-sm rounded-lg border border-gray-300 w-40 p-2 text-gray-500 text-[12px] font-HakgyoansimWoojuR font-semibold"
                                            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                                        >
                                            <button 
                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200 rounded-lg" 
                                                onClick={() => {
                                                    if (contextMenu.model) {
                                                        onRequestDelete(contextMenu.model)
                                                        setContextMenu(null)
                                                    } 
                                                }}>
                                                모델 삭제
                                            </button>
                                            <button 
                                                className="block w-full text-left px-2 py-1 hover:bg-gray-200 rounded-lg"
                                                onClick={() => {
                                                    if (contextMenu.model) {
                                                        onOpenModelInfo(contextMenu.model)
                                                        setContextMenu(null)
                                                    }
                                                }}
                                            >
                                                모델 정보 보기
                                            </button>
                                            <button className="block w-full text-left px-2 py-1 hover:bg-gray-200 rounded-lg" onClick={() => console.log("모델 다시 로드")}>
                                                모델 다시 로드
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {selectedModel && (
                    <ModelPopup 
                        model={selectedModel}
                        visible={!!selectedModel}
                        onClose={() => {
                            clearSelectedModel()
                            setPopupVisible(false)
                        }}
                        onLoadModel={async () => {
                            if (!selectedModel.id) return

                            setLoadingModelId(selectedModel.id)

                            try {
                                await axios.post(`http://localhost:8000/asr/models/load/${selectedModel?.id}`)
                                refreshModels('load')
                            } catch (err) {
                                console.error("모델 로드 실패: ", err)
                                notify('모델 로드를 실패했습니다.', 'error')
                            } finally {
                                clearSelectedModel()
                                setLoadingModelId(null)
                            }
                        }}
                        onUnloadModel={async () => {
                            if (!selectedModel?.id) {
                                notify('선택된 모델이 없습니다.', 'error')
                                return
                            }
                            
                            try {
                                const res = await axios.post(`http://localhost:8000/asr/models/unload/${selectedModel?.id}`) 
                            
                                if (res.data.status === 'success') {
                                    refreshModels('unload')
                                } else {
                                    notify('선택된 모델이 이미 언로드 상태이거나 없는 모델입니다.', 'error')
                                }
                            } catch (err) {
                                console.error("모델 언로드 실패: ", err)
                                notify('모델 언로드에 실패했습니다.', 'error')
                            } finally {
                                clearSelectedModel()
                            }
                        }}
                        loadingModelId={loadingModelId}
                    />
                )}
            </section>
        </>
    )
}