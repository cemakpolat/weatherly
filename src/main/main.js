const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const { readSettings, writeSettings } = require('../storage');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    frame: false, // Disable the default window frame
    resizable: true, // Enable window resizing
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'), // Optional: Use preload.js for secure communication
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Disable Node.js integration in the renderer process
      enableRemoteModule: false, // Disable remote module for security
    },
  });

  // Handle geolocation permission requests
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'geolocation') {
      console.log('Geolocation permission requested - granting');
      callback(true); // Grant permission
    } else {
      callback(false);
    }
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

  // Handle maximize event
  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
}

// Handle settings read/write requests
ipcMain.handle('read-settings', () => readSettings());
ipcMain.handle('write-settings', (event, settings) => writeSettings(settings));

// Handle native notifications
ipcMain.on('show-notification', (event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: icon || path.join(__dirname, '../renderer/icon.png'),
      urgency: 'critical',
    });
    notification.show();
  }
});

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
