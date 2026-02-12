const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  checkPrerequisites: () => ipcRenderer.invoke('check-prerequisites'),
  installHomebrew: () => ipcRenderer.invoke('install-homebrew'),
  installNode: () => ipcRenderer.invoke('install-node'),
  checkCli: (cli) => ipcRenderer.invoke('check-cli', cli),
  installCli: (cli) => ipcRenderer.invoke('install-cli', cli),
  authenticateCli: (cli) => ipcRenderer.invoke('authenticate-cli', cli),
  openUrl: (url) => ipcRenderer.invoke('open-url', url)
});
