// app/llm/hooks/useMCPSource.ts
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8500/mcp/api'

export const getLocalSources = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/local-sources`)
        return response.data
    } catch (error) {
        console.error('Error fetching local sources:', error)
    }
}

export const getRemoteSources = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/remote-sources`)
        return response.data
    } catch (error) {
        console.error('Error fetching remote sources:', error)
    }
}

export const addLocalSource = async (source: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/local-sources`, source)
        return response.data
    } catch (error) {
        console.error('Error adding local source:', error)
    }
}

export const addRemoteSource = async (source: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/remote-sources`, source)
        return response.data
    } catch (error) {
        console.error('Error adding remote source:', error)
    }
}

export const updateLocalSource = async (id: number, source: any) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/local-sources/${id}`, source)
        return response.data
    } catch (error) {
        console.error('Error updating local source:', error)
    }
}

export const updateRemoteSource = async (id: number, source: any) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/remote-sources/${id}`, source)
        return response.data
    } catch (error) {
        console.error('Error updating remote source:', error)
    }
}

export const deleteLocalSource = async (id: number) => {
    try {
        await axios.delete(`${API_BASE_URL}/local-sources/${id}`)
    } catch (error) {
        console.error('Error deleting local source:', error)
    }
}

export const deleteRemoteSource = async (id: number) => {
    try {
        await axios.delete(`${API_BASE_URL}/remote-sources/${id}`)
    } catch (error) {
        console.error('Error deleting remote source:', error)
    }
}
