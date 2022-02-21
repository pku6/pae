"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const electron_1 = require("electron");
const path = (0, path_1.join)(__dirname, '../config.json');
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    loadConfig: () => {
        return (0, fs_1.readFileSync)(path, { encoding: 'utf8' });
    },
    saveConfig: (string) => {
        (0, fs_1.writeFileSync)(path, string);
        electron_1.ipcRenderer.send('config-saved');
    },
    handleOut(listener) {
        electron_1.ipcRenderer.on('out', (e, string) => {
            listener(string);
        });
    }
});