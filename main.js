const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nativeAddon = require('./native-addon/build/Release/addon');

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: "public/icons/favicon.ico",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

let tray = null;

app.whenReady().then(() => {

    //favicon for system tray
    tray = new Tray(path.join(__dirname, 'public/icons/favicon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', click: () => { app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Revolute config');

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('start-hook', () => {
    nativeAddon.startHook();
});

ipcMain.on('stop-hook', () => {
    nativeAddon.stopHook();
});

ipcMain.on('set-f11-key', (event, key) => {
    nativeAddon.setF11Key(key);
});

ipcMain.on('set-f12-key', (event, key) => {
    nativeAddon.setF12Key(key);
});
