export {}

declare global {
    interface Window {
        electronAPI: {
            openModelDialog: () => Promise<string | null>
        }
    }
}