export interface UpdatePayload {
  version: string;
  releaseNotes: string;
  mandatory: boolean;
  action: 'update' | 'downgrade' | 'none';
}

export interface UpdateProgressPayload {
  percent: number;
}

export interface UpdateCheckResult {
  status: 'available' | 'mandatory' | 'none' | 'error';
  message: string;
  update?: UpdatePayload;
}

export interface AppInfo {
  version: string;
  userId: string;
  channel: 'stable' | 'beta';
  lastUpdateCheck: number;
  updateServerUrl: string;
  platform: string;
}

export interface ElectronAPI {
  app: {
    getInfo: () => Promise<AppInfo>;
    setChannel: (channel: 'stable' | 'beta') => Promise<'stable' | 'beta'>;
  };
  updates: {
    onUpdateAvailable: (callback: (payload: UpdatePayload) => void) => () => void;
    onUpdateProgress: (callback: (payload: UpdateProgressPayload) => void) => () => void;
    onUpdateDownloaded: (callback: (payload: UpdatePayload) => void) => () => void;
    onUpdateMandatory: (callback: (payload: UpdatePayload) => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void;
    onUpdateCheckError: (callback: (payload: { message: string }) => void) => () => void;
    triggerUpdateCheck: () => Promise<UpdateCheckResult>;
    restartAndInstall: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
