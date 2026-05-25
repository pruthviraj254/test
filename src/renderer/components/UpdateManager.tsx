'use client';

import { useEffect, useState } from 'react';

interface UpdatePayload {
  version: string;
  releaseNotes: string;
  mandatory: boolean;
  action: 'update' | 'downgrade' | 'none';
}

type UpdatePhase = 'idle' | 'available' | 'downloading' | 'downloaded' | 'mandatory';

function hasElectronAPI(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.updates);
}

export default function UpdateManager() {
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdatePayload | null>(null);
  const [progress, setProgress] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (!hasElectronAPI()) {
      return;
    }

    const updates = window.electronAPI!.updates;

    const unsubscribers = [
      updates.onUpdateAvailable((payload) => {
        setUpdateInfo(payload);
        setPhase('available');
      }),
      updates.onUpdateMandatory((payload) => {
        setUpdateInfo(payload);
        setPhase('mandatory');
      }),
      updates.onUpdateProgress(({ percent }) => {
        setProgress(percent);
        setPhase((current) => (current === 'mandatory' ? 'mandatory' : 'downloading'));
      }),
      updates.onUpdateDownloaded((payload) => {
        setUpdateInfo(payload);
        setProgress(100);
        setPhase((current) => (current === 'mandatory' ? 'mandatory' : 'downloaded'));
      }),
      updates.onUpdateNotAvailable(() => {
        if (phase !== 'mandatory') {
          setPhase('idle');
          setUpdateInfo(null);
          setProgress(0);
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [phase]);

  const handleRestartAndInstall = async () => {
    if (!hasElectronAPI()) {
      return;
    }

    setIsRestarting(true);
    try {
      await window.electronAPI!.updates.restartAndInstall();
    } catch (error) {
      console.error('Failed to restart and install update:', error);
      setIsRestarting(false);
    }
  };

  const handleDismiss = () => {
    if (phase === 'mandatory') {
      return;
    }
    setPhase('idle');
    setUpdateInfo(null);
    setProgress(0);
  };

  if (!hasElectronAPI() || phase === 'idle') {
    return null;
  }

  const showBanner = phase === 'available' || phase === 'downloading' || phase === 'downloaded';
  const isReadyToInstall = phase === 'downloaded' || (phase === 'mandatory' && progress >= 100);

  return (
    <>
      {phase === 'mandatory' && updateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900 p-8 shadow-2xl shadow-amber-500/10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-lg">
                ⚠
              </div>
              <div className="text-sm font-semibold uppercase tracking-wide text-amber-400">
                Required Update
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">
              Version {updateInfo.version} must be installed
            </h2>
            <p className="mb-4 text-sm text-slate-300">
              {updateInfo.action === 'downgrade'
                ? 'Your account is assigned to an earlier version. Please install it to continue.'
                : 'This update is mandatory. The app will remain locked until you install it.'}
            </p>

            {updateInfo.releaseNotes && (
              <div className="mb-6 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
                <div className="mb-2 font-medium text-slate-400">Release notes</div>
                <pre className="whitespace-pre-wrap font-sans">{updateInfo.releaseNotes}</pre>
              </div>
            )}

            {progress > 0 && progress < 100 && (
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-xs text-slate-400">
                  <span>Downloading update</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleRestartAndInstall}
              disabled={!isReadyToInstall || isRestarting}
              className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {isRestarting
                ? 'Installing...'
                : isReadyToInstall
                  ? 'Update Now'
                  : 'Preparing update...'}
            </button>
          </div>
        </div>
      )}

      {showBanner && updateInfo && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-md rounded-2xl border border-blue-500/20 bg-slate-900/95 p-4 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">
                Update available: v{updateInfo.version}
              </div>
              <div className="text-xs text-slate-400">
                {phase === 'downloading'
                  ? `Downloading... ${progress}%`
                  : phase === 'downloaded'
                    ? 'Ready to install'
                    : 'A new version is ready'}
              </div>
            </div>
            {phase !== 'downloading' && (
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 transition hover:text-white"
                aria-label="Dismiss update notification"
              >
                ×
              </button>
            )}
          </div>

          {(phase === 'downloading' || progress > 0) && phase !== 'downloaded' && (
            <div className="mb-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {phase === 'downloaded' && (
            <button
              type="button"
              onClick={handleRestartAndInstall}
              disabled={isRestarting}
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isRestarting ? 'Restarting...' : 'Restart & Update'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
