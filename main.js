const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nativeAddon = require('./native-addon/build/Release/addon');
const noble = require('@abandonware/noble'); // Import noble for BLE communication

let mainWindow;
let tray = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: "public/icons/favicon.ico",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    mainWindow.loadFile('index.html');
}

// Create a tray icon and setup the context menu
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

// Handle window closing event
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC handlers for native-addon
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

// IPC handler for starting BLE scan
ipcMain.on('start-ble-scan', (event) => {
    noble.on('stateChange', state => {
        if (state === 'poweredOn') {
            noble.startScanning();
        } else {
            noble.stopScanning();
        }
    });

    noble.on('discover', peripheral => {
        console.log(`Discovered device: ${peripheral.advertisement.localName}`);

        // Connect to the device
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

                // Fetch and output specific characteristic values
                characteristics.forEach(characteristic => {
                    if (characteristic.properties.includes('read')) {
                        characteristic.read((error, data) => {
                            if (error) {
                                console.error('Error reading characteristic:', error);
                                return;
                            }

                            const id = data.toString('utf-8'); // Adjust the conversion based on your data
                            console.log('Received ID:', id);

                            // Send the ID to the frontend
                            mainWindow.webContents.send('ble-device-id', id);
                        });
                    }

                    if (characteristic.properties.includes('notify')) {
                        characteristic.subscribe(error => {
                            if (error) {
                                console.error('Error subscribing to notifications:', error);
                                return;
                            }

                            characteristic.on('data', (data, isNotification) => {
                                const id = data.toString('utf-8'); // Adjust the conversion based on your data
                                console.log('Received ID via notification:', id);

                                // Send the ID to the frontend
                                mainWindow.webContents.send('ble-device-id', id);
                            });
                        });
                    }
                });
            });
        });

        peripheral.on('disconnect', () => {
            console.log('Disconnected from', peripheral.advertisement.localName);
            noble.startScanning(); // Start scanning again if disconnected
        });
    });
});
