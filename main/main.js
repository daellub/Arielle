import path from 'node:path'
import { fileURLToPath } from 'node:url'
import waitOn from 'wait-on'

import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function createWindow() {
    await waitOn({ resources: ['http://localhost:3000'], timeout: 30000 })
    
    const win = new BrowserWindow({
        width: 1400,
        height: 800,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    win.loadURL('http://localhost:3000')

    win.webContents.openDevTools({ mode: 'detach' })    
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ipcMain.handle('dialog:open-model', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        
        return canceled ? null : filePaths[0];
    })

    ipcMain.handle('shell:open-path', async (_event, targetPath) => {
        return await shell.openPath(targetPath)
    })

    ipcMain.handle('clipboard:copy', async (_event, text) => {
        return clipboard.writeText(text)
    })  
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})