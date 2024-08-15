const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startHook: () => ipcRenderer.send('start-hook'),
    stopHook: () => ipcRenderer.send('stop-hook'),
    setF11Key: (key) => ipcRenderer.send('set-f11-key', key),
    setF12Key: (key) => ipcRenderer.send('set-f12-key', key)
});

document.getElementById('bleDevices').innerHTML = '';

window.electronAPI.onDeviceDiscovered((device) => {
    const devicesList = document.getElementById('devicesList');
    const listItem = document.createElement('li');
    listItem.textContent = `${device.name} (${device.id})`;
    devicesList.appendChild(listItem);
});

function showBLEDevices() {
    showTab('bleDevices');
    window.electronAPI.startBLEScan(); // Start scanning for BLE devices when showing the BLE tab
}

// Call this function when you want to stop scanning, for example, when the user switches tabs
function stopBLEScan() {
    window.electronAPI.stopBLEScan(); // Stop scanning for BLE devices
}
