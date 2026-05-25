'use client';

import { useEffect, useState } from 'react';

import type { AppInfo, UpdateCheckResult } from '../types/electron';

const WHATS_NEW = [
  'New sidebar navigation — Home, Updates, Settings',
  'Stable / Beta channel switcher in Settings',
  'Live app info from electron-store (userId, platform)',
  'Update activity log page',
  'v2.0.0 major release — refreshed cyan/blue theme',
];

export default function HomePage() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    void loadInfo();
    if (window.electronAPI?.updates) {
      void runCheck();
    }
  }, []);

  const loadInfo = async () => {
    if (!window.electronAPI?.app) return;
    setInfo(await window.electronAPI.app.getInfo());
  };

  const runCheck = async () => {
    if (!window.electronAPI?.updates) return;
    setChecking(true);
    try {
      const result = await window.electronAPI.updates.triggerUpdateCheck();
      setCheckResult(result);
      await loadInfo();
    } finally {
      setChecking(false);
    }
  };

  const version = info?.version ?? process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0.0';

  return (
    <main className="p-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold text-white">OneRx Desktop</h1>
          <p className="mt-2 text-slate-400">Controlled updates via your Admin API</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          v{version}
        </span>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Channel" value={info?.channel ?? 'stable'} />
        <Metric label="Platform" value={info?.platform ?? '—'} />
        <Metric
          label="User ID"
          value={info?.userId ? `${info.userId.slice(0, 8)}…` : '—'}
          mono
        />
        <Metric
          label="Last check"
          value={
            info?.lastUpdateCheck
              ? new Date(info.lastUpdateCheck).toLocaleTimeString()
              : 'Never'
          }
        />
      </section>

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Quick actions</h2>
        <button
          type="button"
          onClick={runCheck}
          disabled={checking}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
        >
          {checking ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Checking for updates…
            </>
          ) : (
            'Check for updates now'
          )}
        </button>

        {checkResult && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              checkResult.status === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : checkResult.status === 'none'
                  ? 'border-slate-600 bg-slate-800/50 text-slate-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {checkResult.message}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">What&apos;s new in v2.0.0</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WHATS_NEW.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-400">
                ✦
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-slate-200 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
