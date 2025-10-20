const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
  readSettings: () => ipcRenderer.invoke('read-settings'),
  writeSettings: settings => ipcRenderer.invoke('write-settings', settings),
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  showNotification: (title, body, icon) =>
    ipcRenderer.send('show-notification', { title, body, icon }),
});
