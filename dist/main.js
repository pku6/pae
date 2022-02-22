"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const electron_1 = require("electron");
const clit_1 = require("./clit");
const init_1 = require("./init");
const mod_1 = require("./mod");
let currentWindow;
function createWindow() {
    const mainWindow = currentWindow = new electron_1.BrowserWindow({
        autoHideMenuBar: true,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, '../dist/preload.js')
        }
    });
    clit_1.emitter.on('out', (string) => {
        mainWindow.webContents.send('out', string);
    });
    mainWindow.loadFile((0, path_1.join)(__dirname, '../index.html'));
}
if (!electron_1.app.requestSingleInstanceLock()) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (currentWindow !== undefined) {
            if (currentWindow.isMinimized()) {
                currentWindow.restore();
            }
            currentWindow.focus();
        }
    });
    let started = false;
    electron_1.ipcMain.on('save-config', (e, string) => {
        if (started) {
            return;
        }
        started = true;
        Object.assign(init_1.config, JSON.parse(string));
        (0, init_1.saveConfig)();
        (0, mod_1.main)();
    });
    electron_1.app.whenReady().then(() => {
        createWindow();
    });
    electron_1.app.on('window-all-closed', function () {
        electron_1.app.quit();
    });
}
