'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/updates/', label: 'Updates', icon: '↻' },
  { href: '/settings/', label: 'Settings', icon: '⚙' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/80 p-4">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold">
            Rx
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">OneRx</p>
            <p className="text-sm font-medium text-white">Desktop v2</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <p className="px-2 text-xs text-slate-600">BetaUser test app</p>
      </aside>

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
