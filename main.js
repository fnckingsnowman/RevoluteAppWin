const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nativeAddon = require('./native-addon/build/Release/addon');
const noble = require('@abandonware/noble'); // Import noble for BLE communication


let mainWindow;
let tray = null;

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: "public/icons/favicon.ico",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
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



// BLE features

ipcMain.on('start-ble-scan', (event) => {
    noble.startScanning([], false); // Start scanning for all BLE devices

    noble.on('discover', (device) => {
        const deviceInfo = {
            name: device.advertisement.localName || 'Unknown Device',
            id: device.id
        };
        // Send discovered device to the renderer process
        event.sender.send('ble-device-discovered', deviceInfo);
    });
});

ipcMain.on('stop-ble-scan', () => {
    noble.stopScanning(); // Stop scanning for BLE devices
});