"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const electron_1 = require("electron");
const clit_1 = require("./clit");
const mod_1 = require("./mod");
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
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
let started = false;
electron_1.ipcMain.on('config-saved', () => {
    if (started) {
        return;
    }
    started = true;
    (0, mod_1.main)();
});
electron_1.app.whenReady().then(() => {
    createWindow();
});
electron_1.app.on('window-all-closed', function () {
    electron_1.app.quit();
});
