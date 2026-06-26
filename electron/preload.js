// Exposes a tiny, safe bridge so the game can quit / toggle fullscreen
// when running inside the desktop shell. In a browser, window.steamShell
// is undefined and the game falls back to web behaviour.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('steamShell', {
  isElectron: true,
  quit: () => ipcRenderer.send('app:quit'),
  setFullscreen: (on) => ipcRenderer.send('app:set-fullscreen', on),
  toggleFullscreen: () => ipcRenderer.send('app:toggle-fullscreen'),
});
