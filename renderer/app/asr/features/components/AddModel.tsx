// app/asr/features/components/AddModel.tsx
'use client'

import axios from 'axios'
import clsx from 'clsx'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, EyeOff, EyeOffIcon } from 'lucide-react'

import { useNotificationStore } from '@/app/store/useNotificationStore'
import HuggingFaceModelDrawer from './HuggingFaceModelDrawer'
import { HuggingFaceModel } from '@/app/asr/features/utils/huggingFaceAPI'

type Option = { value: string; label: string }

// 모델 옵션
// TODO: 추가 지원 예정
const modelOptions = [
    { value: "OpenAI", label: "OpenAI" },
    { value: "Meta", label: "Meta" },
    { value: "Google", label: "Google" },
    { value: "Azure", label: "Azure" },
]

// 라이브러리 옵션
const libraryOptions = [
    { value: "OpenVINO", label: "OpenVINO" },
    { value: "PyTorch", label: "PyTorch" },
    { value: "Transformer", label: "Transformer" },
    { value: "TensorFlow", label: "Tensorflow" },
]

// 장치 옵션
const deviceOptions = [
    { value: "AUTO", label: "AUTO" },
    { value: "CPU", label: "CPU" },
    { value: "GPU", label: "GPU" },
    { value: "NPU", label: "NPU" },
]

// 장치 옵션
const languageOptions = [
    { value: "ko", label: "한국어 (ko)" },
    { value: "en", label: "영어 (en)" },
    { value: "jp", label: "일본어 (jp)" },
]

// Azure 지역 설정
const regionOptions = [
    { value: "australiaeast", label: "Australia East" },
    { value: "brazilsouth", label: "Brazil South" },
    { value: "canadacentral", label: "Canada Central" },
    { value: "centralindia", label: "Central India" },
    { value: "centralus", label: "Central US" },
    { value: "eastasia", label: "East Asia" },
    { value: "eastus", label: "East US" },
    { value: "eastus2", label: "East US 2" },
    { value: "francecentral", label: "France Central" },
    { value: "germanywestcentral", label: "Germany West Central" },
    { value: "japaneast", label: "Japan East" },
    { value: "japanwest", label: "Japan West" },
    { value: "koreacentral", label: "Korea Central" },
    { value: "northcentralus", label: "North Central US" },
    { value: "northeurope", label: "North Europe" },
    { value: "norwayeast", label: "Norway East" },
    { value: "qatarcentral", label: "Qatar Central" },
    { value: "southafricanorth", label: "South Africa North" },
    { value: "southcentralus", label: "South Central US" },
    { value: "southeastasia", label: "Southeast Asia" },
    { value: "swedencentral", label: "Sweden Central" },
    { value: "switzerlandnorth", label: "Switzerland North" },
    { value: "switzerlandwest", label: "Switzerland West" },
    { value: "uaenorth", label: "UAE North" },
    { value: "uksouth", label: "UK South" },
    { value: "westcentralus", label: "West Central US" },
    { value: "westeurope", label: "West Europe" },
    { value: "westus", label: "West US" },
    { value: "westus2", label: "West US 2" },
    { value: "westus3", label: "West US 3" },
]

interface AddModelProps {
    open: boolean
    onClose: () => void
    onModelAdded?: () => void
}

export default function AddModel({ open, onClose, onModelAdded }: AddModelProps) {
    const notify = useNotificationStore((s) => s.show)

    // 로컬 설정
    const [name, setName] = useState('')
    const [main, setMain] = useState('')
    const [library, setLibrary] = useState('')
    const [device, setDevice] = useState('CPU')
    const [language, setLanguage] = useState('ko')
    const [path, setPath] = useState('')

    // Azure 설정
    const [azureMode, setAzureMode] = useState<'endpoint' | 'region'>('endpoint')
    const [endpoint, setEndpoint] = useState('')
    const [region, setRegion] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [showApi, setShowApi] = useState(false)

    // UI
    const [showHuggingFaceDrawer, setShowHuggingfaceDrawer] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const isAzureModel = useMemo(() => main === 'Azure', [main])
    const isFormOpen = open

    const endpointValid = useMemo(() => {
        if (azureMode !== 'endpoint') return true
        if (!endpoint) return false

        // 엔드포인트 URL 유효성 검사
        try {
            const url = new URL(endpoint)
            return url.protocol === 'https:'
        } catch {
            return false
        }
    }, [endpoint, azureMode])

    const canSubmit = useMemo(() => {
        if (!name.trim() || !main.trim()) return false
        if (isAzureModel) {
            if (!apiKey.trim()) return false
            if (azureMode === 'endpoint') return endpointValid
            if (azureMode === 'region') return !!region
            return false
        } else {
            return !!library && !!device && !!path
        }
    }, [name, main, isAzureModel, apiKey, azureMode, endpointValid, region, library, device, path])

    const resetForm = () => {
        setName('')
        setMain('')
        setLibrary('')
        setDevice('CPU')
        setLanguage('ko')
        setPath('')
        setEndpoint('')
        setRegion('koreacentral')
        setApiKey('')
        setShowApi(false)
        setAzureMode('endpoint')
    }

    const handleBrowseModelPath = useCallback(async () => {
        try {
            const selectedPath = await window.electronAPI.openModelDialog?.()
            if (selectedPath) setPath(selectedPath)
        } catch (e) {
            notify('파일을 열 수 없습니다.', 'error')
        }
    }, [notify])

    const handleSelectModelFromHuggingface = useCallback((model: HuggingFaceModel) => {
        setMain('Whisper')
        setName(model.cardData?.pretty_name || model.id)
        setLibrary('Transformer')
        setDevice('CPU')
        setLanguage('ko')
        setPath(`/models/${model.id}`)
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) {
            notify('모든 필드를 올바르게 입력해주세요.', 'info')
            return
        }

        setIsLoading(true)
        
        try {
            if (isAzureModel) {
                const azureBody = {
                    name: name.trim(),
                    type: main.trim(),
                    framework: 'Azure',
                    device: 'API',
                    language,
                    endpoint: azureMode === 'endpoint' ? endpoint.trim() : '',
                    region: azureMode === 'region' ? region : '',
                    apiKey: apiKey.trim(),
                    path: '',
                }

                await axios.post("http://localhost:8000/asr/models/register", azureBody)
            } else {
                const localBody = {
                    name: name.trim(),
                    type: main.trim(),
                    framework: library,
                    device,
                    language,
                    path,
                }

                await axios.post("http://localhost:8000/asr/models/register", localBody)
            }

            notify("모델을 등록했습니다.", 'success')
            resetForm()
            onClose()
            onModelAdded?.()
        } catch (err: any) {
            notify("모델 등록을 실패했습니다.", 'error')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [canSubmit, isAzureModel, name, main, library, device, language, path, azureMode, endpoint, region, apiKey, notify, resetForm, onClose, onModelAdded])

    useEffect(() => {
        if (isFormOpen) {
            setShowHuggingfaceDrawer(false)
        }
    }, [isFormOpen])

    useEffect(() => {
        if (!isFormOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                resetForm()
                onClose()
            }
            if (e.key === 'Enter') {
                if (canSubmit && !isLoading) {
                    e.preventDefault()
                    handleSubmit()
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isFormOpen, canSubmit, isLoading, handleSubmit, onClose, resetForm])

    if (!open) return null

    return (
        <>
            <div
                className="fixed inset-0 bg-black/20 text-black flex justify-center items-center z-[9999]"
                onMouseDown={() => { resetForm(); onClose() }}
            >
                <div
                    className="bg-white p-6 rounded-lg w-[400px] shadow-lg"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <h3 className="text-lg font-MapoPeacefull font-semibold mb-4">모델 추가</h3>
        
                    <div className="space-y-3">
                        <CreatableSelect 
                            options={modelOptions} 
                            value={modelOptions.find((o) => o.value === main) ?? (main ? { value: main, label: main } : null)}
                            onChange={option => setMain(option?.value || "")} 
                            placeholder="모델 형식 선택 / 입력"
                            isClearable
                            formatCreateLabel={(inputValue) => `모델 형식 추가: ${inputValue}`}
                        />
        
                        <input
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="input" 
                            placeholder={!isAzureModel ? "모델 이름 (예: Whisper-Small 등 사용자 지정)" : "모델 이름 (예: Azure Main 등 사용자 지정)"}
                            autoFocus
                        />

                        <AnimatePresence mode='wait'>
                            {!isAzureModel&& (
                                <motion.div
                                    key='normal-form'
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-3"
                                >
                                    <Select 
                                        options={libraryOptions} 
                                        value={libraryOptions.find((o) => o.value === library) || null}
                                        onChange={option => setLibrary(option?.value || "")} 
                                        placeholder="라이브러리 선택"
                                        noOptionsMessage={() => "옵션이 없습니다!"}
                                    />
                    
                                    <Select 
                                        options={deviceOptions} 
                                        value={deviceOptions.find((o) => o.value === device) || null}
                                        onChange={option => setDevice(option?.value || "")} 
                                        placeholder="장치 선택"
                                        noOptionsMessage={() => "장치가 없습니다!"}
                                    />
                    
                                    <Select 
                                        options={languageOptions} 
                                        value={languageOptions.find((o) => o.value === language) || null}
                                        onChange={option => setLanguage(option?.value || "")} 
                                        placeholder="언어 선택"
                                    />
                    
                                    <input 
                                        type="text"
                                        value={path} 
                                        readOnly 
                                        className="input" 
                                        placeholder="모델 경로 선택"
                                    />
                                    <div className='flex justify-between gap-2'>
                                        <button 
                                            onClick={handleBrowseModelPath}
                                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            선택
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-yellow-100 rounded hover:bg-yellow-200"
                                            onClick={() => setShowHuggingfaceDrawer(true)}
                                        >
                                            🤗 모델 탐색
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                            
                            {isAzureModel && (
                                <motion.div
                                    key="azure-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-3"
                                >
                                    <div className='relative'>
                                        <input
                                            value={apiKey}
                                            onChange={e => setApiKey(e.target.value)}
                                            className="input"
                                            type={showApi ? 'text' : 'password'}
                                            placeholder="API Key 입력"
                                        />
                                        <button
                                            type='button'
                                            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100'
                                            onClick={() => setShowApi((v) => !v)}
                                            aria-label={showApi ? 'API Key 숨기기' : 'API Key 표시'}
                                        >
                                            {showApi ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                        </button>
                                    </div>

                                    {azureMode === 'endpoint' ? (
                                        <input
                                            value={endpoint}
                                            onChange={e => setEndpoint(e.target.value)}
                                            className={clsx('input', !endpointValid && 'border-red-300 focus:border-red-400')}
                                            placeholder="엔드포인트 URL 입력 (https://...)"
                                        />
                                    ) : (
                                        <Select
                                            options={regionOptions}
                                            value={regionOptions.find((opt) => opt.value === region) || null}
                                            onChange={(opt) => setRegion(opt?.value || '')}
                                            placeholder="리전 선택"
                                        />
                                    )}

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm">엔드포인트</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={azureMode === 'region'}
                                                onChange={() => setAzureMode(azureMode === 'endpoint' ? 'region' : 'endpoint')}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                                        </label>
                                        <span className="text-sm">리전</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            className="px-4 py-2 bg-gray-200 rounded font-MapoPeacefull hover:bg-gray-300"
                            onClick={() => {
                                resetForm()
                                onClose()
                            }}
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        <button
                            className={clsx(
                                'px-4 py-2 bg-blue-500 text-white rounded font-MapoPeacefull',
                                canSubmit && !isLoading ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed opacity-70'
                            )}
                            onClick={handleSubmit}
                            disabled={!canSubmit || isLoading}
                            title={!canSubmit ? '필수 값을 입력하세요' : undefined}
                        >
                            {isLoading ? '등록 중...' : '모델 추가'}
                        </button>
                    </div>
                </div>
            </div>

            {/* HuggingFaceModelDrawer 연결 */}
            {showHuggingFaceDrawer && (
                <HuggingFaceModelDrawer
                    open={showHuggingFaceDrawer}
                    onClose={() => setShowHuggingfaceDrawer(false)}
                    onSelectModel={handleSelectModelFromHuggingface}
                />
            )}
        </>
    )
}