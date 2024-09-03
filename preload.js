const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    
    startScan: () => ipcRenderer.invoke('start-scan'),
    stopScan: () => ipcRenderer.invoke('stop-scan'),
    onDeviceDiscovered: (callback) => ipcRenderer.on('device-discovered', (event, device) => callback(device)),

    startHook: () => ipcRenderer.send('start-hook'),
    stopHook: () => ipcRenderer.send('stop-hook'),
    setF11Key: (key) => ipcRenderer.send('set-f11-key', key),
    setF12Key: (key) => ipcRenderer.send('set-f12-key', key)
});
