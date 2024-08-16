const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startHook: () => ipcRenderer.send('start-hook'),
    stopHook: () => ipcRenderer.send('stop-hook'),
    setF11Key: (key) => ipcRenderer.send('set-f11-key', key),
    setF12Key: (key) => ipcRenderer.send('set-f12-key', key)
});

//BLE features

const startScanButton = document.getElementById('start-scan');
const idsList = document.getElementById('ids-list');

startScanButton.addEventListener('click', () => {
  ipcRenderer.send('start-ble-scan');
});

ipcRenderer.on('ble-device-id', (event, id) => {
  const listItem = document.createElement('li');
  listItem.textContent = id;
  idsList.appendChild(listItem);
});