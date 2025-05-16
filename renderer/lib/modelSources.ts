// lib/modelSources.ts
import axios from 'axios'

export async function getLinkedSourceIds(modelId: number): Promise<number[]> {
    const res = await axios.get(`http://localhost:8500/mcp/llm/models/${modelId}/sources`)
    return res.data.source_ids
}

export async function updateLinkedSources(modelId: number, sourceIds: number[]): Promise<void> {
    await axios.post(`http://localhost:8500/mcp/llm/models/${modelId}/sources`, {
        sourceIds
    })
}