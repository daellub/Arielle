// app/lib/http.ts
import axios from 'axios'

export const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000',
    timeout: 8000,
    withCredentials: false,
})

http.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response) {
            console.warn('[HTTP]', err.response.status, err.response.data)
        } else {
            console.warn('[HTTP]', err.message)
        }
        return Promise.reject(err)
    }
)
