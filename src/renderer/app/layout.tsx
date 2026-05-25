import type { Metadata } from 'next';

import UpdateManager from '../components/UpdateManager';

import './globals.css';

export const metadata: Metadata = {
  title: 'BetaUser Test',
  description: 'Electron Forge + Next.js auto-update test app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
        <UpdateManager />
      </body>
    </html>
  );
}
