// 📑 app/components/AddModel.tsx
'use client'

import axios from 'axios'
import clsx from 'clsx'
import { useState } from 'react'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { AnimatePresence } from 'motion/react'

import Notification from './Notification'


const modelOptions = [
    { value: "OpenAI", label: "OpenAI" },
    { value: "Meta", label: "Meta" },
    { value: "Google", label: "Google" },
];

const libraryOptions = [
    { value: "OpenVINO", label: "OpenVINO" },
    { value: "PyTorch", label: "PyTorch" },
    { value: "Transformer", label: "Transformer" },
    { value: "TensorFlow", label: "Tensorflow" },
];

const deviceOptions = [
    { value: "AUTO", label: "AUTO" },
    { value: "CPU", label: "CPU" },
    { value: "GPU", label: "GPU" },
    { value: "NPU", label: "NPU" },
];

const languageOptions = [
    { value: "ko", label: "한국어 (ko)" },
    { value: "en", label: "영어 (en)" },
    { value: "jp", label: "일본어 (jp)" },
];

interface AddModelProps {
    open: boolean
    onClose: () => void
    onModelAdded?: () => void
}

export default function AddModel({ open, onClose, onModelAdded }: AddModelProps) {
    const [name, setName] = useState('')
    const [main, setMain] = useState('')
    const [library, setLibrary] = useState('')
    const [device, setDevice] = useState('CPU')
    const [language, setLanguage] = useState('ko')
    const [path, setPath] = useState('')
    const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const resetForm = () => {
        setName('')
        setMain('')
        setLibrary('')
        setDevice('CPU')
        setLanguage('ko')
        setPath('')
    }

    const handleSubmit = async () => {
        if (!name || !main || !library || !device || !path) {
            showNotification("모든 필드를 입력해주세요!", 'info')
            return
        }

        setIsLoading(true)

        const body = {
            name,
            type: main,
            framework: library,
            device,
            language,
            path
        }
        
        try {
            const res = await axios.post("http://localhost:8000/asr/models/register", body)
            if (res.status !== 200) throw new Error("모델 등록을 실패했습니다.");

            showNotification("모델을 등록했습니다.", 'success')
            resetForm()
            onClose()
            onModelAdded?.()
        } catch (err) {
            showNotification("모델 등록을 실패했습니다.", 'error')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBrowseModelPath = async () => {
        const selectedPath = await window.electronAPI.openModelDialog()
        if (selectedPath) setPath(selectedPath)
    }

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 2500)
    }    

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-opacity-30 text-black backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-[400px] shadow-lg">
                    <h3 className="text-lg font-MapoPeacefull font-semibold mb-4">모델 추가</h3>
        
                    <div className="space-y-3">
                        <CreatableSelect 
                            options={modelOptions} 
                            value={modelOptions.find(option => option.value === main)}
                            onChange={option => setMain(option?.value || "")} 
                            placeholder="모델 형식 선택 / 입력"
                            isClearable
                            formatCreateLabel={(inputValue) => `모델 형식 추가: ${inputValue}`}
                        />
        
                        <input
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="input" 
                            placeholder="모델 이름 (예: Whisper-Small 등 사용자 지정)"
                        />
        
                        <Select 
                            options={libraryOptions} 
                            value={libraryOptions.find(option => option.value === library)}
                            onChange={option => setLibrary(option?.value || "")} 
                            placeholder="라이브러리 선택"
                            noOptionsMessage={() => "옵션이 없습니다!"}
                        />
        
                        <Select 
                            options={deviceOptions} 
                            value={deviceOptions.find(option => option.value === device)}
                            onChange={option => setDevice(option?.value || "")} 
                            placeholder="장치 선택"
                            noOptionsMessage={() => "장치가 없습니다!"}
                        />
        
                        <Select 
                            options={languageOptions} 
                            value={languageOptions.find(option => option.value === language)}
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
                        <button 
                            onClick={handleBrowseModelPath}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            선택
                        </button>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
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
                            className={clsx("px-4 py-2 bg-blue-500 text-white rounded font-MapoPeacefull hover:bg-blue-600", {
                                'opacity-50 cursor-not-allowed': isLoading
                            })}
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? '등록 중...' : '모델 추가'}
                        </button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}