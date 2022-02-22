import {join} from 'path'
import {readFileSync} from 'fs'
import {contextBridge, ipcRenderer} from 'electron'
const path = join(__dirname, '../config.json')
contextBridge.exposeInMainWorld('electronAPI', {
    continue: () => {
        ipcRenderer.send('continue')
    },
    loadConfig: () => {
        return readFileSync(path, {encoding: 'utf8'})
    },
    pause: () => {
        ipcRenderer.send('pause')
    },
    saveConfig: (string: string) => {
        ipcRenderer.send('save-config', string)
    },
    handleOut(listener: (string: string) => void) {
        ipcRenderer.on('out', (e, string: string) => {
            listener(string)
        })
    }
})