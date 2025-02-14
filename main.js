const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Disable the default window frame
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Optional: Use preload.js for secure communication
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Handle close event
  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  // Handle minimize event
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });
}
   // Open DevTools (optional) // Debugging
// mainWindow.webContents.openDevTools();

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