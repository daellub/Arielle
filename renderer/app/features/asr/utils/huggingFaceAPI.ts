// app/features/asr/utils/huggingFaceAPI.ts
import axios from 'axios'

export interface HuggingFaceModel {
    id: string
    pipeline_tag: string
    likes: number
    downloads: number
    tags?: string[]
    library_name?: string
    cardData?: {
        pretty_name?: string
        thumbnail?: string
        description?: string
    }
}

export async function fetchHuggingFaceModels(limit: number = 30): Promise<HuggingFaceModel[]> {
    try {
        const response = await axios.get(`https://huggingface.co/api/models?pipeline_tag=automatic-speech-recognition&limit=${limit}`)
        return response.data
    } catch (err) {
        console.error('HuggingFace API 연결 실패: ', err)
        return []
    }
}

export function generateModelDescription(model: HuggingFaceModel): string {
    const tags = model.tags || []
    const framework = model.library_name || "Unknown"
    const licenseTag = tags.find(tag => tag.startsWith("license:"))
    const license = licenseTag ? licenseTag.split(":")[1].toUpperCase() : "라이선스 미확인"

    return `${framework} 기반 모델 (${license} License)`
}