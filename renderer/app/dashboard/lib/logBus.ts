// app/dashboard/lib/logBus.ts
export type LogFilterPayload = { tab?: string; query?: string }
export const logBus = new EventTarget()

export function emitLogFilter(payload: LogFilterPayload) {
    logBus.dispatchEvent(new CustomEvent<LogFilterPayload>('log:filter', { detail: payload }))
}