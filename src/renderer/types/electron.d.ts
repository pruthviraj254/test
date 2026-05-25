export interface UpdatePayload {
  version: string;
  releaseNotes: string;
  mandatory: boolean;
  action: 'update' | 'downgrade' | 'none';
}

export interface UpdateProgressPayload {
  percent: number;
}

export interface ElectronAPI {
  updates: {
    onUpdateAvailable: (callback: (payload: UpdatePayload) => void) => () => void;
    onUpdateProgress: (callback: (payload: UpdateProgressPayload) => void) => () => void;
    onUpdateDownloaded: (callback: (payload: UpdatePayload) => void) => () => void;
    onUpdateMandatory: (callback: (payload: UpdatePayload) => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void;
    triggerUpdateCheck: () => Promise<void>;
    restartAndInstall: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
