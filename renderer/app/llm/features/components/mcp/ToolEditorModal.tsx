// app/llm/features/components/mcp/ToolEditorModal.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Save, X, TestTube, Globe, Code2, Cog } from 'lucide-react'
import clsx from 'clsx'

export type ToolEditorMode = 'add' | 'edit'

export interface Tool {
    id?: number
    name: string
    type: 'python' | 'rest' | 'powershell' | string
    command: string
    status: 'active' | 'inactive'
    enabled: boolean
}

interface Props {
    open: boolean
    mode: ToolEditorMode
    initial?: Tool
    onClose: () => void
    onSubmit: (next: Tool) => void | Promise<void>
    onTest?: (draft: Tool) => void | Promise<void>
}

type RestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function parseHeaders(text: string): Record<string, string> {
    const obj: Record<string, string> = {}
    text.split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
        const idx = line.indexOf(':')
        if (idx > 0) {
            const k = line.slice(0, idx).trim()
            const v = line.slice(idx + 1).trim()
            if (k) obj[k] = v
        }
    })
    return obj
}

function stringifyHeaders(obj: Record<string, string>): string {
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('\n')
}

export default function ToolEditorModal({ open, mode, initial, onClose, onSubmit, onTest }: Props) {
    const [name, setName] = useState(initial?.name ?? '')
    const [type, setType] = useState<Tool['type']>(initial?.type ?? 'python')
    const [status, setStatus] = useState<Tool['status']>(initial?.status ?? 'active')
    const [enabled, setEnabled] = useState<boolean>(initial?.enabled ?? true)

    const [script, setScript] = useState<string>(initial?.type === 'python' || initial?.type === 'powershell' ? initial?.command ?? '' : '')

    const [method, setMethod] = useState<RestMethod>('GET')
    const [url, setUrl] = useState<string>('')
    const [headers, setHeaders] = useState<string>('')
    const [body, setBody] = useState<string>('')
    const [timeout, setTimeoutMs] = useState<number | ''>('')

    useEffect(() => {
        if (!open) return
        setName(initial?.name ?? '')
        setType((initial?.type as any) ?? 'python')
        setStatus(initial?.status ?? 'active')
        setEnabled(initial?.enabled ?? true)

        const raw = initial?.command ?? ''
        const isREST = (initial?.type === 'rest') && raw.startsWith('REST::')
        if (isREST) {
            try {
                const json = JSON.parse(raw.slice(6))
                setMethod((json.method ?? 'GET').toUpperCase())
                setUrl(json.url ?? '')
                setHeaders(stringifyHeaders(json.headers ?? {}))
                setBody(json.body ?? '')
                setTimeoutMs(json.timeout ?? '')
            } catch {
                setMethod('GET')
                setUrl(raw)
                setHeaders('')
                setBody('')
                setTimeoutMs('')
            }
        } else if (initial?.type === 'rest') {
            setMethod('GET')
            setUrl(raw)
            setHeaders('')
            setBody('')
            setTimeoutMs('')
        } else {
            setScript(raw)
        }
    }, [open, initial])

    const issues = useMemo(() => {
        const list: string[] = []
        if (!name.trim()) list.push('이름을 입력해 주세요.')
        if (type === 'rest') {
            if (!url.trim()) list.push('요청 URL을 입력해 주세요.')
            try { new URL(url) } catch { list.push('URL 형식이 올바르지 않습니다.') }
            if (['POST', 'PUT', 'PATCH'].includes(method) && (headers.toLowerCase().includes('application/json')) ) {
                try { if (body) JSON.parse(body) } catch { list.push('Body가 JSON 형식이 아닙니다.') }
            }
        } else {
            if (!script.trim()) list.push('커맨드를 입력해 주세요.')
        }
        return list
    }, [name, type, url, method, headers, body, script])

    const compiledCommand = useMemo(() => {
        if (type !== 'rest') return script
        const h = parseHeaders(headers)
        const payload = {
            kind: 'rest',
            method,
            url,
            headers: h,
            body: body || undefined,
            timeout: timeout || undefined,
        }
        return `REST::${JSON.stringify(payload)}`
    }, [type, script, method, url, headers, body, timeout])

    if (!open) return null

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div
                className="scrollLLMArea bg-gradient-to-b from-[#2c2c3d] to-[#262637] rounded-xl p-6 space-y-4
                            w-full max-w-lg max-h-[90vh] overflow-auto ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        {mode === 'add' ? '새 툴 등록' : '툴 수정'}
                    </h4>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white"
                        aria-label="닫기"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs text-white/70">이름</label>
                        <input
                            className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            placeholder="예) 번역기, 데이터 조회"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/70">타입</label>
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            value={type}
                            onChange={(e) => setType(e.target.value as Tool['type'])}
                        >
                            <option className="text-black" value="python">Python</option>
                            <option className="text-black" value="rest">REST</option>
                            <option className="text-black" value="powershell">PowerShell</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/70">상태</label>
                        <select
                            className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Tool['status'])}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/70">Enabled</label>
                        <label className="flex items-center gap-2 select-none">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-white text-sm">{enabled ? '사용중' : '꺼짐'}</span>
                        </label>
                    </div>
                </div>

                {type === 'rest' ? (
                    <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/[.06] space-y-3">
                        <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                            <Globe className="w-4 h-4" /> REST 옵션
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="md:col-span-1">
                                <label className="text-xs text-white/70">Method</label>
                                <select
                                    className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as RestMethod)}
                                >
                                    {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as RestMethod[]).map(m => (
                                        <option className="text-black" key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-white/70">URL</label>
                                <input
                                    className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    placeholder="https://api.example.com/v1/items"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-white/70">Headers (key: value per line)</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-2 rounded bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-y"
                                    placeholder={'Content-Type: application/json\nAuthorization: Bearer ...'}
                                    value={headers}
                                    onChange={(e) => setHeaders(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-white/70">Body</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-2 rounded bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-y"
                                    placeholder={headers.toLowerCase().includes('application/json') ? '{ "name": "value" }' : 'raw body…'}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-white/70">Timeout(ms) (선택)</label>
                                <input
                                    type="number"
                                    min={0}
                                    className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                    placeholder="예: 10000"
                                    value={timeout}
                                    onChange={(e) => setTimeoutMs(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/[.06] space-y-2">
                        <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
                            <Code2 className="w-4 h-4" /> {type === 'python' ? 'Python 커맨드' : 'PowerShell 커맨드'}
                        </div>
                        <textarea
                            rows={6}
                            className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-y"
                            placeholder={type === 'python' ? 'python -c "print(1+1)"' : 'Get-ChildItem'}
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                        />
                    </div>
                )}

                <div className="rounded-xl p-3 ring-1 ring-white/10 bg-white/[.04]">
                    <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                        <Cog className="w-4 h-4" /> 저장될 command
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px] text-white/80 break-all">{compiledCommand}</pre>
                </div>

                {issues.length > 0 && (
                    <div className="rounded-lg p-2 bg-rose-500/10 ring-1 ring-rose-400/30 text-rose-200 text-xs space-y-1">
                        {issues.map((m, i) => <div key={i}>• {m}</div>)}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className={[
                            'text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition',
                            'text-white/70 hover:text-white',
                            'bg-white/0 hover:bg-white/10',
                            'ring-1 ring-white/10 hover:ring-white/20',
                            'focus:outline-none focus:ring-2 focus:ring-white/40'
                        ].join(' ')}
                        title='닫기'
                    >
                        닫기
                    </button>

                    {onTest && (
                        <button
                            onClick={() => onTest({
                                id: initial?.id,
                                name,
                                type,
                                command: compiledCommand,
                                status,
                                enabled,
                            })}
                            className={[
                                'text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition',
                                'bg-white/10 hover:bg-white/15 text-white/90',
                                'ring-1 ring-white/15 hover:ring-white/25',
                                'shadow-sm hover:shadow',
                                'focus:outline-none focus:ring-2 focus:ring-indigo-400/50'
                            ].join(' ')}
                            title='테스트 실행'
                        >
                            <TestTube className="w-4 h-4" />
                            테스트 실행
                        </button>
                    )}
                    <button
                        disabled={issues.length > 0}
                        onClick={() => onSubmit({
                            id: initial?.id,
                            name,
                            type,
                            command: compiledCommand,
                            status,
                            enabled,
                        })}
                        className={clsx(
                            'text-xs inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition',
                            'focus:outline-none',
                            issues.length > 0
                                ? [
                                    'opacity-60 cursor-not-allowed',
                                    'bg-gradient-to-r from-slate-600/40 to-slate-500/40',
                                    'ring-1 ring-white/10 text-white/70'
                                ].join(' ')
                                : [
                                    'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white',
                                    'hover:from-indigo-400 hover:to-fuchsia-400',
                                    'ring-1 ring-indigo-300/40',
                                    'shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]'
                                ].join(' ')
                        )}
                        title={issues.length > 0 ? '필수 항목을 입력해 주세요' : undefined}
                    >
                        <Save className="w-4 h-4" />
                        {mode === 'add' ? '등록' : '수정 완료'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
