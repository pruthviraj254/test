'use client';

import { useEffect, useState } from 'react';

import type { AppInfo } from '../../types/electron';

export default function SettingsPage() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadInfo();
  }, []);

  const loadInfo = async () => {
    if (!window.electronAPI?.app) return;
    setInfo(await window.electronAPI.app.getInfo());
  };

  const switchChannel = async (channel: 'stable' | 'beta') => {
    if (!window.electronAPI?.app || info?.channel === channel) return;
    setSaving(true);
    setSaved(false);
    try {
      await window.electronAPI.app.setChannel(channel);
      await loadInfo();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!info) {
    return (
      <main className="p-8">
        <p className="text-slate-400">Loading settings… (open in desktop app)</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Channel and device configuration</p>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Update channel
        </h2>
        <div className="flex gap-3">
          {(['stable', 'beta'] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => switchChannel(ch)}
              disabled={saving}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold capitalize transition ${
                info.channel === ch
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        {saved && (
          <p className="mt-3 text-sm text-emerald-400">Channel saved — next check uses {info.channel}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Device info
        </h2>
        <dl className="space-y-4 text-sm">
          <Row label="App version" value={`v${info.version}`} />
          <Row label="User ID" value={info.userId} mono />
          <Row label="Platform" value={info.platform} />
          <Row label="Update server" value={info.updateServerUrl} mono />
          <Row
            label="Last update check"
            value={
              info.lastUpdateCheck
                ? new Date(info.lastUpdateCheck).toLocaleString()
                : 'Never'
            }
          />
        </dl>
      </section>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-200 ${mono ? 'break-all font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
