// app/llm/hooks/useIntegrationExecutor.ts
import { http } from '@/app/lib/http'
import axios from 'axios'
import { useMCPStore } from '../features/store/useMCPStore'
interface ToolCall {
    integration: string
    action: string
    query?: string
    params?: Record<string, unknown>
}

export type ExecItem = { title: string; sub?: string; href?: string }
export type ExecSuccess = {
    ok: true
    integration: string
    title?: string
    summary?: string
    items?: ExecItem[]
    raw: any
}
export type ExecFail = {
    ok: false
    integration: string
    error: string
    status?: number
    raw?: any
}
export type ExecResult = ExecSuccess | ExecFail

const MCP_BASE =
    (process.env.NEXT_PUBLIC_MCP_BASE_URL as string) ??
    'http://localhost:8500'

function normalize(integration: string, action: string, data: any): ExecSuccess {
    if (data?.track && data?.artist) {
        return {
            ok: true,
            integration,
            title: action || '도구 실행 결과',
            summary: `Now playing: ${data.track} — ${data.artist}`,
            raw: data,
        }
    }

    if (Array.isArray(data?.items)) {
        const items: ExecItem[] = data.items.slice(0, 8).map((it: any) => ({
            title: it.title ?? it.name ?? it.url ?? '항목',
            sub: it.sub ?? it.snippet ?? it.description,
            href: it.href ?? it.url,
        }))
        return {
            ok: true,
            integration,
            title: action || '도구 실행 결과',
            summary: data.summary ?? undefined,
            items,
            raw: data,
        }
    }

    if (typeof data?.message === 'string' || typeof data?.summary === 'string') {
        return {
            ok: true,
            integration,
            title: action || '도구 실행 결과',
            summary: (data.summary as string) ?? (data.message as string),
            raw: data,
        }
    }

    const brief =
        typeof data === 'string'
            ? data
            : JSON.stringify(data ?? {}, null, 0).slice(0, 300)
    return {
        ok: true,
        integration,
        title: action || '도구 실행 결과',
        summary: brief || '처리가 완료되었습니다.',
        raw: data,
    }
}

export function useIntegrationExecutor() {
    const getConfig = useMCPStore.getState().getCurrentConfig

    const execute = async (toolCall: ToolCall): Promise<ExecResult> => {
        const config = getConfig()
        if (!config?.integrations.includes(toolCall.integration)) {
            return {
                ok: false,
                integration: toolCall.integration,
                error: '비활성화된 통합 기능입니다.'
            }
        }

        const url = `${MCP_BASE}/mcp/integrations/${toolCall.integration}/execute`
        const payload = {
            action: toolCall.action,
            query: toolCall.query,
            ...toolCall.params,
        }

        try {
            const { data, status } = await http.post(url, payload, { timeout: 15000 })
            return normalize(toolCall.integration, toolCall.action, data)
        } catch (err: any) {
            const status: number | undefined = err?.response?.status
            const msg: string =
                err?.response?.data?.message ??
                err?.message ??
                '요청 중 오류가 발생했습니다.'
            return {
                ok: false,
                integration: toolCall.integration,
                error: msg,
                status,
                raw: err?.response?.data,
            }
        }
    }

    return { execute }
}