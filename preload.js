const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startHook: () => ipcRenderer.send('start-hook'),
    stopHook: () => ipcRenderer.send('stop-hook'),
    setF11Key: (key) => ipcRenderer.send('set-f11-key', key),
    setF12Key: (key) => ipcRenderer.send('set-f12-key', key),

    // New method for BLE device discovery
    onDeviceDiscovered: (callback) => ipcRenderer.on('ble-device-discovered', (event, deviceName) => {
        callback(deviceName);
    })
});
