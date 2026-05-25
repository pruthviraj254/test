import type { Metadata } from 'next';

import ClientLayout from '../components/ClientLayout';
import UpdateManager from '../components/UpdateManager';

import './globals.css';

export const metadata: Metadata = {
  title: 'OneRx Desktop',
  description: 'Electron desktop app with controlled auto-updates',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <ClientLayout>{children}</ClientLayout>
        <UpdateManager />
      </body>
    </html>
  );
}
