const { app, BrowserWindow, ipcMain } = require('electron');
const noble = require('@abandonware/noble');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Ensure this is false to allow ipcRenderer
    },
  });

  mainWindow.loadFile('index.html');

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

          // Example: Fetch and output a specific characteristic's value
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
