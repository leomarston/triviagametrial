// Trivia Quest — Electron main process (desktop / Steam shell)
const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// single-instance (Steam may relaunch)
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#2E2548',
    title: 'Trivia Quest',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  createWindow();
  // F11 toggles fullscreen at the OS-window level
  globalShortcut.register('F11', () => { if (win) win.setFullScreen(!win.isFullScreen()); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());

// renderer bridge
ipcMain.on('app:quit', () => app.quit());
ipcMain.on('app:set-fullscreen', (_e, on) => { if (win) win.setFullScreen(!!on); });
ipcMain.on('app:toggle-fullscreen', () => { if (win) win.setFullScreen(!win.isFullScreen()); });
