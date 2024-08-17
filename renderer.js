const { contextBridge, ipcRenderer } = require('electron');

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
