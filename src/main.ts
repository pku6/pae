import {join} from 'path'
import {app, BrowserWindow, ipcMain} from 'electron'
import {emitter} from './clit'
import {config, saveConfig} from './init'
import {main} from './mod'
function createWindow() {
    const mainWindow = new BrowserWindow({
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