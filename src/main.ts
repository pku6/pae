import {join} from 'path'
import {app, BrowserWindow, ipcMain} from 'electron'
import {emitter} from './clit'
import {config, saveConfig} from './init'
import {main} from './mod'
let currentWindow: BrowserWindow | undefined
function createWindow() {
    const mainWindow = currentWindow = new BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../dist/preload.js')
        }
    })
    emitter.on('out', (string: string) => {
        mainWindow.webContents.send('out', string)
    })
    mainWindow.loadFile(join(__dirname, '../index.html'))
}
if (!app.requestSingleInstanceLock()) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (currentWindow !== undefined) {
            if (currentWindow.isMinimized()) {
                currentWindow.restore()
            }
            currentWindow.focus()
        }
    })
    let started = false
    ipcMain.on('save-config', (e, string: string) => {
        if (started) {
            return
        }
        started = true
        Object.assign(config, JSON.parse(string))
        saveConfig()
        main()
    })
    app.whenReady().then(() => {
        createWindow()
    })
    app.on('window-all-closed', function () {
        app.quit()
    })
}