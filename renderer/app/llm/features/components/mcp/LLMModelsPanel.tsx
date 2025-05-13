// app/llm/features/components/mcp/LLMModelsPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import axios from 'axios'
import {
    X,
    Plus,
    Trash2,
    Wifi,
    WifiOff,
    Puzzle 
} from 'lucide-react'
import Tooltip from '../LLMTooltip'
import { useNotificationStore } from '@/app/store/useNotificationStore'

interface LLMModel {
    id: string
    name: string
    endpoint: string
    type: string
    framework: string
    status: 'active' | 'inactive'
    enabled: boolean
    apiKey?: string
    token?: string
}

export default function LLMModelsPanel() {
    const [models, setModels] = useState<LLMModel[]>([])
    const [newModel, setNewModel] = useState({
        name: '',
        endpoint: '',
        type: 'Chatbot',
        framework: 'LLaMA',
        status: 'inactive',
        enabled: true,
        apiKey: '',
        token: '',
    })
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const notify = useNotificationStore((s) => s.show)

    useEffect(() => {
        loadModels()
    }, [])

    async function loadModels() {
        setLoading(true)
        try {
            const response = await axios.get('http://localhost:8500/mcp/llm/models')
            setModels(response.data.models)
        } catch (error) {
            console.error('Error loading models:', error)
            notify('MCP 서버에서 모델을 불러오는 중 오류가 발생했습니다.', 'error')
        } finally {
            setLoading(false)
        }
    }

    async function registerModel() {
        if (!newModel.name || !newModel.endpoint) {
            notify('모델 이름과 엔드포인트를 입력하세요.', 'info')
            return
        }

        try {
            await axios.post('http://localhost:8500/mcp/llm/model', newModel)
            notify('MCP 서버에 모델을 등록했습니다.', 'success')
            loadModels()
            setShowAddModal(false)
            setNewModel({
                name: '',
                endpoint: '',
                type: 'Chatbot',
                framework: 'LLaMA',
                status: 'inactive',
                enabled: true,
                apiKey: '',
                token: '',
            })
        } catch (err) {
            console.error('Error registering model:', err)
            notify('MCP 서버에 모델을 등록하는 중 오류가 발생했습니다.', 'error')
        }
    }

    async function deleteModel(modelId: string) {
        try {
            if (!modelId) {
                notify('모델 ID가 잘못되었습니다.', 'error')
                return
            }

            await axios.delete(`http://localhost:8500/mcp/llm/model/${modelId}`)
            notify('MCP 서버에서 모델을 삭제했습니다.', 'success')
            loadModels()
        } catch (err) {
            console.error('Error deleting model:', err)
            notify('MCP 서버에서 모델을 삭제하는 중 오류가 발생했습니다.', 'error')
        }
    }

    async function toggleModelStatus(modelId: string, enabled: boolean) {
        try {
            const updatedModel = models.find((m) => m.id === modelId)
            if (!updatedModel) {
                console.error(`모델을 찾을 수 없습니다: ${modelId}`)
                return
            }

            console.log("Updated Model:", updatedModel)

            // 모델의 필수 필드가 비어있다면 기본값 설정
            if (!updatedModel.name || !updatedModel.endpoint || !updatedModel.type || !updatedModel.framework) {
                notify('모델의 필수 항목을 모두 입력해주세요.', 'info')
                return
            }

            updatedModel.framework = updatedModel.framework || 'defaultFramework'

            // status와 enabled 값에 맞게 일관성 있게 설정
            updatedModel.enabled = enabled
            updatedModel.status = enabled ? 'active' : 'inactive'

            // apiKey와 token이 null이면 빈 문자열로 처리
            const apiKey = updatedModel.apiKey || ''
            const token = updatedModel.token || ''

            // axios 요청 보내기
            const response = await axios.patch(`http://localhost:8500/mcp/llm/model/${modelId}`, {
                name: updatedModel.name,
                endpoint: updatedModel.endpoint,
                type: updatedModel.type,
                framework: updatedModel.framework,
                enabled: updatedModel.enabled,
                status: updatedModel.status,
                apiKey: apiKey,  // null이면 빈 문자열로 처리
                token: token,    // null이면 빈 문자열로 처리
            })


            console.log("Response:", response.data)

            // 모델 목록을 새로 고침
            loadModels()
            notify(`모델이 ${enabled ? '활성화' : '비활성화'}되었습니다.`, 'success')
        
        } catch (err) {
            console.error('Error toggling model status:', err)
            notify('모델 상태를 변경하는 중 오류가 발생했습니다.', 'error')
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/80">등록된 LLM 모델</p>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-400 transition"
                >
                    <Plus className="w-3 h-3" />
                    <span>모델 추가</span>
                </button>
            </div>

        {loading ? (
            <div className="text-sm text-white/60">로딩 중…</div>
        ) : (
            <div className="space-y-2">
                {models.map((model) => (
                    <div key={model.id} className="bg-white/5 p-2 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-start gap-2">
                                <Puzzle className="w-3.5 h-3.5 text-white/40" />
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white text-[12px] font-medium">{model.name}</span>
                                        <span className="text-white/50 text-[8px]">{model.type === '' ? '' : (model.type)}</span>
                                    </div>
                                    <span className="text-white/40 text-[8px] truncate">{model.endpoint}</span>
                                </div>
                            </div>
                            <button
                                className="text-white/40 hover:text-red-400"
                                onClick={() => deleteModel(model.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2 mb-1 ml-1">
                            <div 
                                className="w-6 h-3.5 bg-white/20 rounded-full relative cursor-pointer"
                                onClick={() => toggleModelStatus(model.id, !model.enabled)}
                            >   
                                <div className={clsx(
                                    'w-2.5 h-2.5 rounded-full absolute top-0.5 transition-all',
                                    model.enabled ? 'left-2 bg-indigo-400' : 'left-0.5 bg-white/40'
                                )} />
                            </div>
                            
                            {model.status === 'active' ? (
                                <Wifi className="w-3 h-3 text-green-400" />
                            ) : (
                                <WifiOff className="w-3 h-3 text-red-400" />
                            )}
                            <p
                                className={`text-[10px] font-medium ${model.status === 'active' ? 'text-green-400' : 'text-red-400'}`}
                            >
                                {model.status === 'active' ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {showAddModal && createPortal(
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowAddModal(false)}
            >
                <div
                    className="bg-[#2c2c3d] rounded-lg p-6 space-y-4 w-[90%] max-w-lg max-h-[90vh] overflow-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-white">새 LLM 모델 등록</h4>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="text-white/50 hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <input
                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                        placeholder="모델 이름"
                        value={newModel.name}
                        onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    />
                    <input
                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                        placeholder="엔드포인트 URL"
                        value={newModel.endpoint}
                        onChange={(e) => setNewModel({ ...newModel, endpoint: e.target.value })}
                    />
                    <select
                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                        value={newModel.type}
                        onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
                    >
                        <option className="text-black" value="chatbot">Chatbot</option>
                        <option className="text-black" value="qa">QA</option>
                    </select>
                    <select
                        className="w-full p-2 rounded bg-white/10 text-white text-sm"
                        value={newModel.framework}
                        onChange={(e) => setNewModel({ ...newModel, framework: e.target.value })}
                    >
                        <option className="text-black" value="LLaMA">LLaMA</option>
                        <option className="text-black" value="PyTorch">PyTorch</option>
                        <option className="text-black" value="TensorFlow">TensorFlow</option>
                    </select>

                    <div className="space-y-2">
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="API Key"
                            value={newModel.apiKey}
                            onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                        />
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm"
                            placeholder="Bearer Token"
                            value={newModel.token}
                            onChange={(e) => setNewModel({ ...newModel, token: e.target.value })}
                        />
                    </div>

                    <button onClick={registerModel} className="text-xs text-indigo-300">
                        등록
                    </button>
                </div>
            </div>,
            document.body
        )}
        </div>
    )
}