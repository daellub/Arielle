<<<<<<< HEAD
// app/llm/hooks/useIntegrationExecutor.ts
import axios from 'axios'
import { useMCPStore } from '../features/store/useMCPStore'
import { useLLMStore } from '../features/store/useLLMStore'

interface ToolCall {
    integration: string
    action: string
    query?: string
}

export function useIntegrationExecutor() {
    const getConfig = useMCPStore.getState().getCurrentConfig
    const addMessage = useLLMStore.getState().addMessage

    const execute = async (toolCall: ToolCall) => {
        const config = getConfig()
        if (!config?.integrations.includes(toolCall.integration)) return false

        try {
            const res = await axios.post(
                `http://localhost:8500/mcp/integrations/${toolCall.integration}/execute`,
                {
                    action: toolCall.action,
                    query: toolCall.query
                }
            )

            const { track, artist, message } = res.data

            if (track && artist) {
                addMessage({
                    role: 'system',
                    message: `🎵 Now playing: ${track} by ${artist}`
                })
            } else if (message) {
                addMessage({
                    role: 'system',
                    message: `🎵 ${message}`
                })
            } else {
                addMessage({
                    role: 'system',
                    message: '🎵 명령이 성공적으로 실행되었습니다.'
                })
            }

            return true
        } catch (err) {
            console.error('Integration 실행 실패:', err)
            addMessage({
                role: 'system',
                message: '⚠️ Spotify 명령 실행에 실패했습니다.'
            })
            return false
        }
    }

    return { execute }
=======
// app/llm/hooks/useIntegrationExecutor.ts
import axios from 'axios'
import { useMCPStore } from '../features/store/useMCPStore'
import { useLLMStore } from '../features/store/useLLMStore'

interface ToolCall {
    integration: string
    action: string
    query?: string
}

export function useIntegrationExecutor() {
    const getConfig = useMCPStore.getState().getCurrentConfig
    const addMessage = useLLMStore.getState().addMessage

    const execute = async (toolCall: ToolCall) => {
        const config = getConfig()
        if (!config?.integrations.includes(toolCall.integration)) return false

        try {
            const res = await axios.post(
                `http://localhost:8500/mcp/integrations/${toolCall.integration}/execute`,
                {
                    action: toolCall.action,
                    query: toolCall.query
                }
            )

            const { track, artist, message } = res.data

            if (track && artist) {
                addMessage({
                    role: 'system',
                    message: `🎵 Now playing: ${track} by ${artist}`
                })
            } else if (message) {
                addMessage({
                    role: 'system',
                    message: `🎵 ${message}`
                })
            } else {
                addMessage({
                    role: 'system',
                    message: '🎵 명령이 성공적으로 실행되었습니다.'
                })
            }

            return true
        } catch (err) {
            console.error('Integration 실행 실패:', err)
            addMessage({
                role: 'system',
                message: '⚠️ Spotify 명령 실행에 실패했습니다.'
            })
            return false
        }
    }

    return { execute }
>>>>>>> 0d69c71783bfc4735eb78eb3d3c6c1864b0cda81
}