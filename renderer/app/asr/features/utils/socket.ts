// app/asr/features/utils/socket.ts
import { io, Socket } from 'socket.io-client'

type ServerToClientEvents = {
    "log:new": (msg: string) => void
    "status:update": (status: { active: boolean; message?: string }) => void
    "model:loaded": (info: { id: string; name: string }) => void
}

type ClientToServerEvents = {
    "log:request": (filter: string) => void
    "model:load": (id: string) => void
    "model:unload": (id: string) => void
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(BASE_URL, {
    transports: ["websocket"],
    withCredentials: true,

    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
})

export default socket