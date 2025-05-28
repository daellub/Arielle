// vrm/dev-main.js
const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        frame: false,
        transparent: true,
        alwaysOnTop: false,
        resizable: false,
        hasShadow: false,
        skipTaskbar: false,
        focusable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    win.setIgnoreMouseEvents(false)
    win.loadURL('http://localhost:5173')
})
