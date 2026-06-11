const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const BASE_URL = isDev
  ? 'http://localhost:3001'
  : 'https://portpolio-beta-mocha.vercel.app';

/** @type {BrowserWindow | null} */
let mainWin = null;
/** @type {BrowserWindow | null} */
let floatWin = null;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'portpolio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWin.loadURL(BASE_URL);

  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(BASE_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) mainWin.webContents.openDevTools({ mode: 'detach' });

  mainWin.on('closed', () => { mainWin = null; });
}

function createFloatWindow() {
  if (floatWin && !floatWin.isDestroyed()) {
    floatWin.focus();
    return;
  }

  floatWin = new BrowserWindow({
    width: 280,
    height: 380,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: '#00000000',
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  floatWin.loadURL(`${BASE_URL}/timer/float`);
  floatWin.setAlwaysOnTop(true, 'screen-saver');

  if (isDev) floatWin.webContents.openDevTools({ mode: 'detach' });

  floatWin.on('closed', () => { floatWin = null; });
}

ipcMain.handle('open-float-timer', () => createFloatWindow());
ipcMain.handle('close-float-timer', () => {
  if (floatWin && !floatWin.isDestroyed()) floatWin.close();
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
