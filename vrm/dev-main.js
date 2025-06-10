// vrm/dev-main.js
const { app, BrowserWindow, screen, ipcMain } = require('electron')

let win
let devPanelVisible = false

app.whenReady().then(() => {
    const display = screen.getPrimaryDisplay()

    win = new BrowserWindow({
        width: 1920,
        height: 1080,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        hasShadow: false,
        skipTaskbar: false,
        focusable: true,
        roundedCorners: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    win.setIgnoreMouseEvents(true)
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })

    ipcMain.on('toggle-dev-panel', () => {
        devPanelVisible = !devPanelVisible
        if (win) {
            win.setIgnoreMouseEvents(!devPanelVisible, { forward: true })
            win.webContents.send('dev-panel-visibility', devPanelVisible)
        }
    })
})
