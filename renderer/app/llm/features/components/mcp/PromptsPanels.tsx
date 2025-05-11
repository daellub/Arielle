// app/llm/features/components/mcp/PromptsPanel.tsx
'use client'

import { useState } from 'react'
import { Trash2, Copy, FileText, X } from 'lucide-react'
import clsx from 'clsx'

interface Prompt {
    name: string
    preview: string
    full: string
    variables: string[]
}

const dummyPrompts: Prompt[] = [
    {
        name: 'Friendly Assistant',
        preview: '당신은 상냥하고 배려 깊은 AI 어시스턴트입니다...',
        full: '당신은 상냥하고 배려 깊은 AI 어시스턴트입니다. 항상 친절한 말투로 응답하고, 감정을 잘 표현해주세요.\n\n사용자 입력: {user_input}\n현재 날짜: {date}',
        variables: ['{user_input}', '{date}']
    },
    {
        name: 'Character RP',
        preview: 'You are roleplaying as an ancient elf queen...',
        full: 'You are roleplaying as an ancient elf queen who speaks with poetic tone.\n\nPersona: {persona}\nContext: {context}',
        variables: ['{persona}', '{context}']
    }
]

export default function PromptsPanel() {
    const [prompts, setPrompts] = useState<Prompt[]>(dummyPrompts)
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">🧾 프롬프트 템플릿</h3>
                <button className="text-xs text-indigo-300 hover:text-indigo-400 transition">+ 템플릿 추가</button>
            </div>

            {prompts.map((p, i) => (
                <div
                    key={i}
                    onClick={() => setSelectedPrompt(p)}
                    className="p-3 rounded-md bg-white/5 hover:bg-white/10 transition text-xs space-y-1"
                >
                    <div className="flex items-center gap-1 font-medium text-white">
                        <FileText className="w-3.5 h-3.5 text-white/40" />
                        {p.name}
                    </div>

                    <div className="text-white/50 text-[11px] line-clamp-2">{p.preview}</div>
                    <div className="text-[11px] text-white/40">변수: {p.variables.join(', ')}</div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button className="text-white/40 hover:text-white/70">
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="text-white/30 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}

            {selectedPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2c2c3d] rounded-lg p-6 w-[320px] space-y-4 text-sm text-white relative">
                        <button className="absolute top-2 right-2 text-white/50 hover:text-white" onClick={() => setSelectedPrompt(null)}>
                            <X className="w-4 h-4" />
                        </button>
                        <div className="font-semibold">{selectedPrompt.name}</div>
                        <pre className="font-MapoPeacefull whitespace-pre-wrap text-white/70 text-xs">
                            {selectedPrompt.full}
                        </pre>
                        <div className="text-white/40 text-xs">변수: {selectedPrompt.variables.join(', ')}</div>
                    </div>
                </div>
            )}
        </div>
    )
}
