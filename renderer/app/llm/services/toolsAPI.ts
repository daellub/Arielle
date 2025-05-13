// app/llm/services/toolsAPI.ts
import axios from 'axios'

const API_BASE = 'http://localhost:8500/mcp/api/tools'

export const fetchTools = async () => {
    const res = await axios.get(API_BASE)
    return res.data
}

export const createTool = async (tool: any) => {
    const res = await axios.post(API_BASE, tool)
    return res.data
}

export const updateTool = async (id: number, tool: any) => {
    const res = await axios.patch(`${API_BASE}/${id}`, tool)
    return res.data
}

export const deleteTool = async (id: number) => {
    await axios.delete(`${API_BASE}/${id}`)
}