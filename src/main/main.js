const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { readSettings, writeSettings } = require('../storage');

let mainWindow;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Disable the default window frame
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'), // Optional: Use preload.js for secure communication
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Disable Node.js integration in the renderer process
      enableRemoteModule: false, // Disable remote module for security
    },
  });

  mainWindow.loadFile('src/renderer/index.html');

   // Open DevTools (optional) // Debugging
  // mainWindow.webContents.openDevTools();

// Handle close event
  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  // Handle minimize event
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });
}

// Handle settings read/write requests
ipcMain.handle('read-settings', () => readSettings());
ipcMain.handle('write-settings', (event, settings) => writeSettings(settings));

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