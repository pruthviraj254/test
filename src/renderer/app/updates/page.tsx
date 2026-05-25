'use client';

import { useEffect, useState } from 'react';

import type { UpdateCheckResult } from '../../types/electron';

interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warn';
}

export default function UpdatesPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [checking, setChecking] = useState(false);

  const addLog = (message: string, type: LogEntry['type']) => {
    setLogs((prev) => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), message, type },
      ...prev,
    ].slice(0, 20));
  };

  useEffect(() => {
    if (!window.electronAPI?.updates) return;

    const { updates } = window.electronAPI;

    const unsubs = [
      updates.onUpdateAvailable((p) =>
        addLog(`Update available: v${p.version} (${p.action})`, 'success'),
      ),
      updates.onUpdateMandatory((p) =>
        addLog(`Mandatory update required: v${p.version}`, 'warn'),
      ),
      updates.onUpdateProgress(({ percent }) =>
        addLog(`Download progress: ${percent}%`, 'info'),
      ),
      updates.onUpdateDownloaded((p) =>
        addLog(`Download complete: v${p.version} — ready to install`, 'success'),
      ),
      updates.onUpdateNotAvailable(() => addLog('No update available', 'info')),
      updates.onUpdateCheckError(({ message }) => addLog(message, 'error')),
    ];

    addLog('Update listener initialized', 'info');

    return () => unsubs.forEach((u) => u());
  }, []);

  const handleCheck = async () => {
    if (!window.electronAPI?.updates) return;
    setChecking(true);
    addLog('Manual update check started…', 'info');
    try {
      const result: UpdateCheckResult = await window.electronAPI.updates.triggerUpdateCheck();
      if (result.status === 'none' || result.status === 'error') {
        addLog(result.message, result.status === 'error' ? 'error' : 'info');
      }
    } finally {
      setChecking(false);
    }
  };

  const typeStyles = {
    info: 'border-slate-700 text-slate-300',
    success: 'border-emerald-500/30 text-emerald-300',
    error: 'border-red-500/30 text-red-300',
    warn: 'border-amber-500/30 text-amber-300',
  };

  return (
    <main className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Updates</h1>
          <p className="mt-1 text-sm text-slate-400">Activity log and manual update checks</p>
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Run check'}
        </button>
      </header>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex gap-4 rounded-lg border bg-slate-900/40 px-4 py-3 text-sm ${typeStyles[log.type]}`}
            >
              <span className="shrink-0 font-mono text-xs text-slate-500">{log.time}</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
