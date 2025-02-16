import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import electronStore from 'electron-store';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('src/renderer/index.html');

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
