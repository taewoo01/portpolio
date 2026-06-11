const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openFloatTimer: () => ipcRenderer.invoke('open-float-timer'),
  closeFloatTimer: () => ipcRenderer.invoke('close-float-timer'),
});
