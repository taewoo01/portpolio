const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
const BASE_URL = isDev
  ? 'http://localhost:3001'
  : 'https://portpolio-beta-mocha.vercel.app';
const BASE_ORIGIN = new URL(BASE_URL).origin;

function isAppUrl(url) {
  try {
    // startsWith 접두 비교는 "https://앱도메인.attacker.com" 류를 통과시킨다 → 오리진 정확 비교
    return new URL(url).origin === BASE_ORIGIN;
  } catch {
    return false;
  }
}

function openExternalSafe(url) {
  try {
    const { protocol } = new URL(url);
    // file:, ms-msdt: 등 임의 프로토콜 핸들러 실행 방지 — 웹 링크만 허용
    if (protocol === 'http:' || protocol === 'https:') shell.openExternal(url);
  } catch {
    // 파싱 불가 URL은 무시
  }
}

function hardenWebContents(win) {
  // 새 창: 앱 오리진만 신뢰 창으로 허용, 그 외는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) return { action: 'allow' };
    openExternalSafe(url);
    return { action: 'deny' };
  });

  // 일반 네비게이션/리다이렉트: 외부 오리진으로의 창 이동 차단
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      openExternalSafe(url);
    }
  });

  // 권한 요청(카메라·마이크·위치 등) 기본 거부
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
}

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

  hardenWebContents(mainWin);

  if (isDev) mainWin.webContents.openDevTools({ mode: 'detach' });

  mainWin.on('closed', () => { mainWin = null; });
}

function createFloatWindow() {
  if (floatWin && !floatWin.isDestroyed()) {
    floatWin.focus();
    return;
  }

  floatWin = new BrowserWindow({
    width: 300,
    height: 440,
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
  hardenWebContents(floatWin);

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
