// app/utils/api.ts
import axios from 'axios'

export const fetchModels = async () => {
    const res = await axios.get("http://localhost:8000/asr/models")
    return res.data
}

export const loadModelById = async (modelId: string) => {
    const res = await axios.post(`http://localhost:8000/asr/models/load/${modelId}`)
    return res.data
}

export const unloadModelById = async (modelId: string) => {
    const res = await axios.post(`http://localhost:8000/asr/models/unload/${modelId}`)
    return res.data
}