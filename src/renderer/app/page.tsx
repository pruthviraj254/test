'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.updates) {
      void window.electronAPI.updates.triggerUpdateCheck();
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-widest text-blue-400">
        Windows Desktop Test App
      </p>
      <h1 className="mb-4 text-4xl font-bold text-white">BetaUser Update System</h1>
      <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
        This dummy Electron Forge + Next.js app checks your Admin API for controlled
        updates across stable and beta channels. Mandatory updates block the UI until
        installed; pinned versions suppress prompts.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Current version</dt>
            <dd className="mt-1 font-mono text-sm text-slate-200">1.0.0</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Update server</dt>
            <dd className="mt-1 truncate font-mono text-sm text-slate-200">
              {process.env.NEXT_PUBLIC_UPDATE_SERVER_URL ?? 'Not configured'}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => window.electronAPI?.updates.triggerUpdateCheck()}
          className="mt-6 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-500 hover:text-white"
        >
          Check for updates now
        </button>
      </div>
    </main>
  );
}
