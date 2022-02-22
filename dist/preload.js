"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const electron_1 = require("electron");
const path = (0, path_1.join)(__dirname, '../config.json');
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    continue: () => {
        electron_1.ipcRenderer.send('continue');
    },
    loadConfig: () => {
        return (0, fs_1.readFileSync)(path, { encoding: 'utf8' });
    },
    pause: () => {
        electron_1.ipcRenderer.send('pause');
    },
    saveConfig: (string) => {
        electron_1.ipcRenderer.send('save-config', string);
    },
    handleOut(listener) {
        electron_1.ipcRenderer.on('out', (e, string) => {
            listener(string);
        });
    }
});
