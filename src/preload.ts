import {join} from 'path'
import {readFileSync} from 'fs'
import {contextBridge, ipcRenderer} from 'electron'
import {config, saveConfig} from './init'
const path = join(__dirname, '../config.json')
contextBridge.exposeInMainWorld('electronAPI', {
    loadConfig: () => {
        return readFileSync(path, {encoding: 'utf8'})
    },
    saveConfig: (string: string) => {
        Object.assign(config, JSON.parse(string))
        saveConfig()
        ipcRenderer.send('config-saved')
    },
    handleOut(listener: (string: string) => void) {
        ipcRenderer.on('out', (e, string: string) => {
            listener(string)
        })
    }
})