const { app, Tray, Menu, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nativeAddon = require('./native-addon/build/Release/addon');
const noble = require('@abandonware/noble');
// The advertising UUID to scan for
const TARGET_ADVERTISING_NAME = 'Revolute';
// The service UUID to look for after connecting
const TARGET_SERVICE_UUID = '00000000000000000000003323de1223';

const PERIPHERAL_UUID = 'd02894667120';

let scanning = false;

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

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('start-scan', () => {
        if (!scanning) {
            scanning = true;
            noble.startScanning();
            console.log('Started scanning for BLE devices.');
        }
    });

    ipcMain.handle('stop-scan', () => {
        if (scanning) {
            noble.stopScanning();
            scanning = false;
            console.log('Stopped scanning for BLE devices.');
        }
    });

    const discoveredDevices = new Map();

    noble.on('stateChange', state => {
        if (state === 'poweredOn') {
            if (scanning) {
                noble.startScanning();
            }
        } else {
            noble.stopScanning();
        }
    });

    noble.on('discover', async peripheral => {
        // Check if the discovered peripheral has the target advertising UUID
        if (peripheral.advertisement.localName === TARGET_ADVERTISING_NAME && peripheral.uuid === PERIPHERAL_UUID) {
            let deviceInfo = {
                name: peripheral.advertisement.localName || 'Unnamed device',
                uuid: peripheral.uuid,
                rssi: peripheral.rssi,
                services: []
            };
            try {
                // Connect to the peripheral
                await peripheral.connectAsync();
                console.log(`Connected to ${peripheral.advertisement.localName}`);
    
                // Discover services
                const services = await peripheral.discoverServicesAsync();
                let foundTargetService = false;
                for (const service of services) {
                    let serviceInfo = {
                        uuid: service.uuid,
                        characteristics: []
                    };
    
                    
                    // Check if the service UUID matches the target
                    if (service.uuid === TARGET_SERVICE_UUID) {
                        foundTargetService = true;
                        // Discover characteristics for each service
                        const characteristics = await service.discoverCharacteristicsAsync();
                        for (const characteristic of characteristics) {
                            serviceInfo.characteristics.push(characteristic.uuid);
                        }
                        deviceInfo.services.push(serviceInfo);
                        break; // We found the service we're interested in, no need to search further
                    }
                }
    
                if (!foundTargetService) {
                    console.log(`  Target service UUID ${TARGET_SERVICE_UUID} not found.`);
                }
    
                // Disconnect from the peripheral
                await peripheral.disconnectAsync();
            } catch (error) {
                console.error(`Error connecting or discovering services: ${error.message}`);
            }
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('device-discovered', deviceInfo);
            });
        }
    });
});

let tray = null;

app.whenReady().then(() => {

    //favicon for system tray
    tray = new Tray(path.join(__dirname, 'public/icons/favicon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Quit', click: () => { app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Revolute config');

    //createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            //createWindow();
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
