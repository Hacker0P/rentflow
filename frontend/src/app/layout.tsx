import type { Metadata } from 'next';
import '../styles/globals.css';
import { PwaInstaller } from '@/components/pwa-installer';

export const metadata: Metadata = {
  title: 'RentFlow — Rent & Maintenance Collection App',
  description: 'Effortless rent collection and maintenance requests for small landlords and tenants.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RentFlow',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
        <PwaInstaller />
      </body>
    </html>
  );
}

