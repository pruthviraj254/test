import {
  app,
  autoUpdater,
  BrowserWindow,
  ipcMain,
  net,
} from 'electron';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { getChannel, getLastUpdateCheck, getOrCreateUserId, setChannel, store } from './store';

export interface UpdateCheckResponse {
  hasUpdate: boolean;
  version: string;
  url: string;
  releaseNotes: string;
  mandatory: boolean;
  action: 'update' | 'downgrade' | 'none';
}

export interface UpdatePayload {
  version: string;
  releaseNotes: string;
  mandatory: boolean;
  action: UpdateCheckResponse['action'];
}

export interface UpdateCheckResult {
  status: 'available' | 'mandatory' | 'none' | 'error';
  message: string;
  update?: UpdatePayload;
}

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 5_000;

let checkInterval: NodeJS.Timeout | null = null;
let pendingUpdate: UpdateCheckResponse | null = null;
let downloadedInstallerPath: string | null = null;
let isDownloading = false;

function getUpdateServerUrl(): string {
  const configPath = path.join(app.getPath('userData'), 'update-config.json');

  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
        updateServerUrl?: string;
      };
      if (config.updateServerUrl) {
        return config.updateServerUrl;
      }
    }
  } catch {
    // ignore invalid config
  }

  const configured =
    process.env.UPDATE_SERVER_URL ??
    process.env.NEXT_PUBLIC_UPDATE_SERVER_URL;

  if (configured) {
    return configured;
  }

  return 'http://localhost:3000/update/check';
}

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

function sendToRenderer(channel: string, payload?: unknown): void {
  const window = getMainWindow();
  if (!window || window.isDestroyed()) {
    return;
  }
  window.webContents.send(channel, payload);
}

function buildCheckUrl(): string {
  const baseUrl = getUpdateServerUrl();
  const params = new URLSearchParams({
    userId: getOrCreateUserId(),
    currentVersion: app.getVersion(),
    platform: process.platform,
    channel: getChannel(),
  });

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
}

async function fetchUpdateCheck(): Promise<UpdateCheckResponse | null> {
  const url = buildCheckUrl();
  console.log('[updater] Checking for updates:', url);

  return new Promise((resolve) => {
    const request = net.request({ method: 'GET', url });

    request.on('response', (response) => {
      let body = '';

      response.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });

      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 400) {
          console.warn(
            `[updater] Server returned ${response.statusCode} for update check`,
          );
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(body) as UpdateCheckResponse);
        } catch (error) {
          console.warn('[updater] Failed to parse update response:', error);
          resolve(null);
        }
      });
    });

    request.on('error', (error) => {
      console.warn('[updater] Update check request failed:', error.message);
      resolve(null);
    });

    request.end();
  });
}

function toUpdatePayload(data: UpdateCheckResponse): UpdatePayload {
  return {
    version: data.version,
    releaseNotes: data.releaseNotes,
    mandatory: data.mandatory,
    action: data.action,
  };
}

async function downloadFromUrl(
  url: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  const fileName = path.basename(new URL(url).pathname) || 'update-installer.exe';
  const destination = path.join(os.tmpdir(), `betauser-update-${Date.now()}-${fileName}`);

  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let receivedBytes = 0;
    let totalBytes = 0;

    request.on('response', (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      totalBytes = Number(response.headers['content-length'] ?? 0);
      const fileStream = fs.createWriteStream(destination);

      response.on('data', (chunk: Buffer) => {
        receivedBytes += chunk.length;
        fileStream.write(chunk);

        if (totalBytes > 0) {
          onProgress(Math.min(100, Math.round((receivedBytes / totalBytes) * 100)));
        }
      });

      response.on('end', () => {
        fileStream.end();
        onProgress(100);
        resolve(destination);
      });

      response.on('error', (error) => {
        fileStream.close();
        fs.unlink(destination, () => undefined);
        reject(error);
      });
    });

    request.on('error', reject);
    request.end();
  });
}

async function downloadUpdateDirectly(data: UpdateCheckResponse): Promise<void> {
  if (isDownloading || !data.url) {
    return;
  }

  isDownloading = true;

  try {
    downloadedInstallerPath = await downloadFromUrl(data.url, (percent) => {
      sendToRenderer('update-progress', { percent });
    });

    sendToRenderer('update-downloaded', toUpdatePayload(data));
  } catch (error) {
    console.warn('[updater] Direct download failed:', error);
  } finally {
    isDownloading = false;
  }
}

async function downloadViaAutoUpdater(data: UpdateCheckResponse): Promise<void> {
  if (isDownloading || !data.url) {
    return;
  }

  isDownloading = true;
  pendingUpdate = data;

  try {
    autoUpdater.setFeedURL({
      url: data.url,
      serverType: 'json',
    });

    autoUpdater.checkForUpdates();
  } catch (error) {
    console.warn(
      '[updater] autoUpdater check failed, falling back to direct download:',
      error,
    );
    isDownloading = false;
    await downloadUpdateDirectly(data);
  }
}

async function performUpdateCheck(): Promise<UpdateCheckResult> {
  try {
    store.set('lastUpdateCheck', Date.now());

    const data = await fetchUpdateCheck();
    if (!data) {
      const message = `Could not reach update server at ${getUpdateServerUrl()}`;
      console.warn(`[updater] ${message}`);
      sendToRenderer('update-check-error', { message });
      return { status: 'error', message };
    }

    if (data.action === 'none' || !data.hasUpdate) {
      sendToRenderer('update-not-available');
      return { status: 'none', message: `You are on the latest version (${data.version || app.getVersion()}).` };
    }

    pendingUpdate = data;
    const payload = toUpdatePayload(data);

    if (data.mandatory) {
      sendToRenderer('update-mandatory', payload);
    } else {
      sendToRenderer('update-available', payload);
    }

    if (data.action === 'downgrade') {
      void downloadUpdateDirectly(data);
      return {
        status: data.mandatory ? 'mandatory' : 'available',
        message: `Update ${data.version} is ready.`,
        update: payload,
      };
    }

    if (data.action === 'update') {
      if (process.platform === 'darwin') {
        void downloadUpdateDirectly(data);
      } else {
        void downloadViaAutoUpdater(data);
      }

      return {
        status: data.mandatory ? 'mandatory' : 'available',
        message: `Update ${data.version} is available.`,
        update: payload,
      };
    }

    return { status: 'none', message: 'No update needed.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update check failed';
    console.warn('[updater] Update check failed:', error);
    sendToRenderer('update-check-error', { message });
    return { status: 'error', message };
  }
}

function installDownloadedUpdate(): void {
  if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
    if (process.platform === 'darwin') {
      spawn('open', [downloadedInstallerPath], { detached: true, stdio: 'ignore' }).unref();
      return;
    }

    if (process.platform === 'win32') {
      spawn(downloadedInstallerPath, ['/S'], {
        detached: true,
        stdio: 'ignore',
      }).unref();
      app.quit();
      return;
    }
  }

  autoUpdater.quitAndInstall();
}

function setupAutoUpdaterEvents(): void {
  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for update via autoUpdater');
  });

  autoUpdater.on('update-available', () => {
    if (pendingUpdate) {
      sendToRenderer('update-available', toUpdatePayload(pendingUpdate));
    }
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('update-not-available');
    isDownloading = false;
  });

  autoUpdater.on('update-downloaded', () => {
    isDownloading = false;
    if (pendingUpdate) {
      sendToRenderer('update-downloaded', toUpdatePayload(pendingUpdate));
    }
  });

  autoUpdater.on('error', (error) => {
    console.warn('[updater] autoUpdater error:', error.message);
    isDownloading = false;

    if (pendingUpdate?.action === 'update' && pendingUpdate.url) {
      void downloadUpdateDirectly(pendingUpdate);
    }
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle('updates:check', async () => performUpdateCheck());

  ipcMain.handle('updates:restart-and-install', () => {
    installDownloadedUpdate();
  });

  ipcMain.handle('app:get-info', () => ({
    version: app.getVersion(),
    userId: getOrCreateUserId(),
    channel: getChannel(),
    lastUpdateCheck: getLastUpdateCheck(),
    updateServerUrl: getUpdateServerUrl(),
    platform: process.platform,
  }));

  ipcMain.handle('app:set-channel', (_event, channel: 'stable' | 'beta') => {
    setChannel(channel);
    return getChannel();
  });
}

export function initUpdater(): void {
  setupAutoUpdaterEvents();
  registerIpcHandlers();

  setTimeout(() => {
    void performUpdateCheck();
  }, INITIAL_DELAY_MS);

  checkInterval = setInterval(() => {
    void performUpdateCheck();
  }, CHECK_INTERVAL_MS);
}

export function stopUpdater(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
