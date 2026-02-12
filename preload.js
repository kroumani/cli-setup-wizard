const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Platform
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Setup
  checkPrerequisites: () => ipcRenderer.invoke('check-prerequisites'),
  checkCli: (cli) => ipcRenderer.invoke('check-cli', cli),
  installCli: (cli) => ipcRenderer.invoke('install-cli', cli),

  // Chat
  sendMessage: (cli, message, sessionId) =>
    ipcRenderer.invoke('send-message', cli, message, sessionId),
  stopProcess: (cli) => ipcRenderer.invoke('stop-process', cli),

  // Streaming callbacks
  onStreamChunk: (callback) => {
    ipcRenderer.on('stream-chunk', (_event, cli, chunk) => callback(cli, chunk));
  },
  onStreamEnd: (callback) => {
    ipcRenderer.on('stream-end', (_event, cli) => callback(cli));
  },

  // Utilities
  openTerminalWithCli: (cli) => ipcRenderer.invoke('open-terminal-with-cli', cli),
  openUrl: (url) => ipcRenderer.invoke('open-url', url)
});
