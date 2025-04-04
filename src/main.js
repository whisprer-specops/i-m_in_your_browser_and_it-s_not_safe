const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const regedit = require('regedit');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('checkWSH', async () => {
  const key = 'HKLM\\SOFTWARE\\Microsoft\\Windows Script Host\\Settings';
  return new Promise((resolve) => {
    regedit.list([key], (err, result) => {
      if (err || !result[key]) return resolve('Error');
      const value = result[key].values?.Enable?.value || '1';
      resolve(value === '1' ? 'active' : 'inactive');
    });
  });
});

ipcMain.handle('activateWSH', async () => {
  const key = 'HKLM\\SOFTWARE\\Microsoft\\Windows Script Host\\Settings';
  return new Promise((resolve, reject) => {
    regedit.putValue({
      [key]: {
        Enable: {
          value: '1',
          type: 'REG_SZ'
        }
      }
    }, (err) => {
      if (err) return reject('Failed to activate');
      resolve('Activated');
    });
  });
});
🧠 preload.js – Secure IPC Bridge
js
Copy
Edit
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('WSHControl', {
  checkWSH: () => ipcRenderer.invoke('checkWSH'),
  activateWSH: () => ipcRenderer.invoke('activateWSH')
});