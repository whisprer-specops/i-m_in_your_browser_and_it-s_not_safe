const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const regedit = require('regedit');
const { execFile } = require('child_process');

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

// Check admin status and escalate if needed
function ensureAdmin() {
  return new Promise((resolve, reject) => {
    execFile(path.join(__dirname, 'RunAsAdmin.exe'), [process.argv[1]], (err, stdout, stderr) => {
      if (err) {
        reject('Error executing RunAsAdmin: ' + stderr);
        return;
      }
      const exitCode = err ? err.code : 0;
      if (exitCode === 0) {
        resolve(true); // Admin privileges confirmed
      } else if (exitCode === 1) {
        resolve(false); // Not admin, escalation attempted
      } else {
        reject('Unexpected exit code: ' + exitCode);
      }
    });
  });
}

app.whenReady().then(async () => {
  try {
    const isAdmin = await ensureAdmin();
    if (!isAdmin) {
      console.log('Fren, we tried to escalate to admin, but it didn’t stick. Please approve the UAC prompt or run as admin manually.');
      app.quit(); // Exit if admin privileges not obtained
      return;
    }
    createWindow(); // Proceed only if admin
  } catch (err) {
    console.error('Fren, something broke in the admin check: ', err);
    app.quit();
  }
});

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