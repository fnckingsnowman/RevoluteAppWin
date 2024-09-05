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

//document.addEventListener('DOMContentLoaded', () => {
document.getElementById('startScanBtn').addEventListener('click', () => {
  window.electronAPI.startScan();
});

document.getElementById('stopScanBtn').addEventListener('click', () => {
  window.electronAPI.stopScan();
});

window.electronAPI.onDeviceDiscovered(device => {
  const resultsDiv = document.getElementById('results');
  let deviceHTML = `
      <div>
          <h2>${device.name}</h2>
          <p>UUID: ${device.uuid}</p>
          <p>RSSI: ${device.rssi}</p>
          <h3>Services:</h3>
          <ul>
              ${device.services.map(service => `
                  <li>
                      <strong>Service UUID:</strong> ${service.uuid}
                      <ul>
                          ${service.characteristics.map(char => `<li>Characteristic UUID: ${char}</li>`).join('')}
                      </ul>
                  </li>
              `).join('')}
          </ul>
      </div>
  `;
  resultsDiv.insertAdjacentHTML('beforeend', deviceHTML);
});
//});