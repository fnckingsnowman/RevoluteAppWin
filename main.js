const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nativeAddon = require('./native-addon/build/Release/addon');
const noble = require('@abandonware/noble');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: "public/icons/favicon.ico",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // Ensure node integration for ipcRenderer
            contextIsolation: false // Allows ipcRenderer communication
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

    // Start BLE scanning when app is ready
    noble.on('stateChange', state => {
        if (state === 'poweredOn') {
            noble.startScanning();
            console.log('BLE scanning started');
        } else {
            noble.stopScanning();
            console.log('BLE scanning stopped');
        }
    });

    noble.on('discover', peripheral => {
        console.log(`Discovered device: ${peripheral.advertisement.localName}`);

        // You can pass discovered device info to the renderer process
        mainWindow.webContents.send('ble-device-discovered', peripheral.advertisement.localName);

        // Auto-connect to the first discovered device (or implement your own logic)
        noble.stopScanning(); // Stop scanning to connect
        peripheral.connect(error => {
            if (error) {
                console.error('Error connecting:', error);
                return;
            }

            console.log('Connected to', peripheral.advertisement.localName);

            // Discover services and characteristics
            peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
                if (error) {
                    console.error('Error discovering services and characteristics:', error);
                    return;
                }

                characteristics.forEach(characteristic => {
                    if (characteristic.properties.includes('read')) {
                        characteristic.read((error, data) => {
                            if (error) {
                                console.error('Error reading characteristic:', error);
                                return;
                            }

                            console.log('Characteristic value:', data.toString());
                        });
                    }

                    if (characteristic.properties.includes('write')) {
                        const buffer = Buffer.from('Hello, BLE!');
                        characteristic.write(buffer, false, error => {
                            if (error) {
                                console.error('Error writing to characteristic:', error);
                            } else {
                                console.log('Wrote to characteristic');
                            }
                        });
                    }

                    if (characteristic.properties.includes('notify')) {
                        characteristic.subscribe(error => {
                            if (error) {
                                console.error('Error subscribing to notifications:', error);
                                return;
                            }

                            characteristic.on('data', (data, isNotification) => {
                                console.log('Notification received:', data.toString());
                            });
                        });
                    }
                });
            });

            // Handle disconnect
            peripheral.on('disconnect', () => {
                console.log('Disconnected from', peripheral.advertisement.localName);
                noble.startScanning(); // Start scanning again if disconnected
            });
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Native addon handlers
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
