import { app, BrowserWindow } from 'electron';
import path from 'path';

import { initUpdater, stopUpdater } from './updater';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const NEXT_DEV_SERVER_URL = process.env.NEXT_DEV_SERVER_URL ?? 'http://localhost:3001';
const isDev = !app.isPackaged;

if (require('electron-squirrel-startup')) {
  app.quit();
}

function getRendererUrl(): string {
  if (isDev) {
    return NEXT_DEV_SERVER_URL;
  }

  return path.join(process.resourcesPath, 'out', 'index.html');
}

const createWindow = async (): Promise<void> => {
  const mainWindow = new BrowserWindow({
    height: 720,
    width: 1024,
    show: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    await mainWindow.loadURL(NEXT_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(getRendererUrl());
  }
};

app.whenReady().then(() => {
  void createWindow();
  initUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopUpdater();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
