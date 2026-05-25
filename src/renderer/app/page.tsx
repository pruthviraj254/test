'use client';

import { useEffect, useState } from 'react';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';
const UPDATE_SERVER = process.env.NEXT_PUBLIC_UPDATE_SERVER_URL ?? 'Not configured';

const WHATS_NEW = [
  'Refreshed dashboard with live version badge',
  'Status cards for channel, platform, and update server',
  'Improved update overlay styling',
  'Release v1.1.0 — test mandatory & optional update flows',
];

export default function HomePage() {
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.updates) {
      void triggerCheck();
    }
  }, []);

  const triggerCheck = async () => {
    if (!window.electronAPI?.updates) return;
    setChecking(true);
    try {
      await window.electronAPI.updates.triggerUpdateCheck();
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold shadow-lg shadow-blue-500/20">
            Rx
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              OneRx Desktop
            </p>
            <h1 className="text-2xl font-bold text-white">BetaUser Test App</h1>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          v{APP_VERSION} installed
        </span>
      </header>

      {/* Status cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatusCard label="Channel" value="stable" accent="blue" />
        <StatusCard label="Platform" value="darwin / win32" accent="violet" />
        <StatusCard
          label="Last check"
          value={lastChecked ?? 'On launch'}
          accent="slate"
        />
      </section>

      {/* Main panel */}
      <section className="mb-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm">
        <h2 className="mb-1 text-lg font-semibold text-white">Update configuration</h2>
        <p className="mb-5 text-sm text-slate-400">
          Controlled updates via your Admin API — mandatory, pinning, and channel rules.
        </p>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Update server</p>
          <p className="break-all font-mono text-sm text-slate-300">{UPDATE_SERVER}</p>
        </div>

        <button
          type="button"
          onClick={triggerCheck}
          disabled={checking}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Checking…
            </>
          ) : (
            'Check for updates now'
          )}
        </button>
      </section>

      {/* What's new */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          What&apos;s new in v{APP_VERSION}
        </h2>
        <ul className="space-y-3">
          {WHATS_NEW.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function StatusCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'blue' | 'violet' | 'slate';
}) {
  const accentMap = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    violet: 'border-violet-500/20 bg-violet-500/5',
    slate: 'border-slate-700 bg-slate-900/60',
  };

  return (
    <div className={`rounded-xl border p-4 ${accentMap[accent]}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
