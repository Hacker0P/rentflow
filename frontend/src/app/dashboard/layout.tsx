'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { LandlordBottomNav } from '@/components/layout/landlord-bottom-nav';
import { LandlordMobileHeader } from '@/components/layout/landlord-mobile-header';
import { Smartphone, Monitor, Wifi, Battery, Sparkles } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'APP' | 'DESKTOP'>('DESKTOP');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      const saved = localStorage.getItem('rentflow_landlord_view_mode') as 'APP' | 'DESKTOP' | null;
      if (saved) {
        setViewMode(saved);
      } else {
        setViewMode('DESKTOP'); // Clean modern widescreen SaaS layout by default
      }
      setMounted(true);
    }
  }, [router]);

  const toggleViewMode = () => {
    const next = viewMode === 'APP' ? 'DESKTOP' : 'APP';
    setViewMode(next);
    localStorage.setItem('rentflow_landlord_view_mode', next);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500 tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const getPageTitle = (path: string) => {
    if (path.includes('/properties')) return 'Properties & Units';
    if (path.includes('/tenants')) return 'Tenants & Leases';
    if (path.includes('/invoices')) return 'Invoices & Billing';
    if (path.includes('/payments')) return 'Payment Ledger';
    if (path.includes('/maintenance')) return 'Maintenance Desk';
    if (path.includes('/settings')) return 'Settings & Payouts';
    return 'Dashboard Overview';
  };

  return (
    <>
      {/* 1. NATIVE MOBILE SCREENS (< 1024px) - FULLSCREEN NATIVE EXPERIENCE */}
      <div className="lg:hidden min-h-screen bg-slate-50 flex flex-col text-slate-900">
        <LandlordMobileHeader viewMode={viewMode} onToggleViewMode={toggleViewMode} />
        <main className="flex-1 px-4 py-5 pb-24 overflow-y-auto">
          {children}
        </main>
        <LandlordBottomNav isInsideFrame={false} />
      </div>

      {/* 2. DESKTOP SCREENS (>= 1024px) */}
      <div className="hidden lg:block min-h-screen">
        {viewMode === 'APP' ? (
          /* OPTIONAL MOBILE APP SIMULATOR ON DESKTOP */
          <div className="min-h-screen bg-slate-950 py-8 px-4 flex flex-col items-center justify-start select-none">
            {/* Top Mode Switcher Bar */}
            <div className="mb-6 flex items-center justify-between gap-4 max-w-[420px] w-full bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 pl-2 text-xs font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Mobile Preview Mode</span>
              </div>
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-semibold text-white transition shadow-xs"
                title="Expand to Full Desktop Portal"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Desktop</span>
              </button>
            </div>

            {/* Smartphone Device Frame */}
            <div className="max-w-[420px] w-full h-[860px] bg-slate-50 rounded-[48px] border-[10px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-white/10">
              {/* Status Bar */}
              <div className="bg-white text-slate-900 px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold select-none shrink-0 border-b border-slate-100">
                <span>9:41</span>
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-slate-700" />
                  <span className="text-[10px] font-bold text-slate-700">5G</span>
                  <Battery className="w-3.5 h-3.5 text-slate-700" />
                </div>
              </div>

              {/* Mobile Header Inside Phone Frame */}
              <LandlordMobileHeader viewMode={viewMode} onToggleViewMode={toggleViewMode} />

              {/* Scrollable Mobile App Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 text-slate-900 select-text">
                {children}
              </div>

              {/* In-Frame Bottom Navigation Bar */}
              <LandlordBottomNav isInsideFrame={true} />
            </div>
          </div>
        ) : (
          /* FULL WIDESCREEN DESKTOP PORTAL */
          <div className="flex min-h-screen bg-slate-50 text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header
                title={getPageTitle(pathname)}
                viewMode={viewMode}
                onToggleViewMode={toggleViewMode}
              />
              <main className="p-6 xl:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
