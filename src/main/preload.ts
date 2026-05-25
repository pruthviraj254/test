import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface UpdatePayload {
  version: string;
  releaseNotes: string;
  mandatory: boolean;
  action: 'update' | 'downgrade' | 'none';
}

export interface UpdateProgressPayload {
  percent: number;
}

type Unsubscribe = () => void;

function subscribe<T>(
  channel: string,
  callback: (payload: T) => void,
): Unsubscribe {
  const listener = (_event: IpcRendererEvent, payload: T) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld('electronAPI', {
  updates: {
    onUpdateAvailable: (callback: (payload: UpdatePayload) => void): Unsubscribe =>
      subscribe<UpdatePayload>('update-available', callback),

    onUpdateProgress: (callback: (payload: UpdateProgressPayload) => void): Unsubscribe =>
      subscribe<UpdateProgressPayload>('update-progress', callback),

    onUpdateDownloaded: (callback: (payload: UpdatePayload) => void): Unsubscribe =>
      subscribe<UpdatePayload>('update-downloaded', callback),

    onUpdateMandatory: (callback: (payload: UpdatePayload) => void): Unsubscribe =>
      subscribe<UpdatePayload>('update-mandatory', callback),

    onUpdateNotAvailable: (callback: () => void): Unsubscribe =>
      subscribe<void>('update-not-available', () => callback()),

    triggerUpdateCheck: (): Promise<void> => ipcRenderer.invoke('updates:check'),

    restartAndInstall: (): Promise<void> => ipcRenderer.invoke('updates:restart-and-install'),
  },
});
