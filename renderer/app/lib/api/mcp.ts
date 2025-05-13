// app/lib/api/mcp.ts
import axios from 'axios'

const MCP_BASE = 'http://localhost:8500/mcp'

export interface ServerEntry { }

export const listServers = () =>
    axios.get<ServerEntry[]>(`${MCP_BASE}/servers`)

export const createServer = (srv: Partial<ServerEntry>) =>
    axios.post(`${MCP_BASE}/servers`, srv)

export const updateServer = (alias: string, patch: Partial<ServerEntry>) =>
    axios.patch(`${MCP_BASE}/servers/${alias}`, patch)

export const deleteServer = (alias: string) =>
    axios.delete(`${MCP_BASE}/servers/${alias}`)

export const getServerStatus = (alias: string) =>
    axios.get<Partial<ServerEntry>>(`${MCP_BASE}/servers/${alias}/status`)