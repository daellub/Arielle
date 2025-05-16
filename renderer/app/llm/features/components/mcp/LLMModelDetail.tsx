// app/llm/features/components/mcp/LLMModelDetail.tsx
'use client'

import { JSX, useEffect, useState } from 'react'
import axios from 'axios'
import {
    FileText,
    Folder,
    Globe,
    Link,
    Wrench,
    BrainCircuit,
    SlidersHorizontal
} from 'lucide-react'

interface Props {
    modelId: string
}

interface MCPParams {
    integrations?: string[]
    prompts?: number[]
    local_sources?: number[]
    remote_sources?: number[]
    tools?: { name: string }[]
    memory?: {
        strategy: string
        maxTokens: number
        includeHistory: boolean
        saveMemory: boolean
        contextPrompts: { content: string }[]
    }
    sampling?: {
        temperature: number
        topK: number
        topP: number
        repetitionPenalty: number
    }
}

export default function LLMModelDetails({ modelId }: Props) {
    const [params, setParams] = useState<MCPParams>({})

    useEffect(() => {
        axios.get(`http://localhost:8500/mcp/llm/model/${modelId}/params`)
            .then(res => {
                const data = res.data
                setParams(data)
            })
            .catch(err => console.error('MCP params 로드 실패:', err))
    }, [modelId])

    const renderList = (label: string, items: any[], icon: JSX.Element) => (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/70 text-[11px] font-semibold">
                {icon}
                {label}
            </div>
            {items.length === 0 ? (
                <div className="ml-5 text-white/40 text-xs">없음</div>
            ) : (
                <ul className="list-disc ml-6 text-xs text-white">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            )}
        </div>
    )

    return (
        <div className="bg-white/10 rounded-md p-3 text-white/80 text-xs space-y-4">
            {renderList('연결된 MCP 서버', params.integrations || [], <Link className="w-3 h-3 text-white/70" />)}
            {renderList('연동된 프롬프트 ID', params.prompts || [], <FileText className="w-3 h-3 text-white/70" />)}
            {renderList('로컬 데이터 소스', params.local_sources || [], <Folder className="w-3 h-3 text-white/70" />)}
            {renderList('원격 데이터 소스', params.remote_sources || [], <Globe className="w-3 h-3 text-white/70" />)}

            {renderList(
                '연결된 툴',
                (params.tools || []).map(t => t.name),
                <Wrench className="w-3 h-3 text-white/70" />
            )}

            {params.memory && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/70 text-[11px] font-semibold">
                        <BrainCircuit className="w-3 h-3 text-white/70" />
                        Memory 전략
                    </div>
                    <div className="ml-5 text-white text-xs">{params.memory.strategy}</div>
                </div>
            )}

            {params.sampling && (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/70 text-[11px] font-semibold">
                        <SlidersHorizontal className="w-3 h-3 text-white/70" />
                        Sampling 설정
                    </div>
                    <ul className="ml-6 list-disc text-white text-xs">
                        <li>temperature: {params.sampling.temperature}</li>
                        <li>top_k: {params.sampling.topK}</li>
                        <li>top_p: {params.sampling.topP}</li>
                        <li>repetition_penalty: {params.sampling.repetitionPenalty}</li>
                    </ul>
                </div>
            )}
        </div>
    )
}
