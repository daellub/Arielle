export {}

declare global {
    interface Window {
        electronAPI: {
            openModelDialog: () => Promise<string | null>
            openPath: (path: string) => Promise<string>
            copyToClipboard: (text: string) => void
        }
    }
}