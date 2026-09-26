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
  const [viewMode, setViewMode] = useState<'APP' | 'DESKTOP'>('APP');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      const saved = localStorage.getItem('rentflow_landlord_view_mode') as 'APP' | 'DESKTOP' | null;
      if (saved) {
        setViewMode(saved);
      } else {
        setViewMode('APP'); // Default to APP view to give landlord the mobile app experience
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Opening Landlord Portal...</p>
        </div>
      </div>
    );
  }

  const getPageTitle = (path: string) => {
    if (path.includes('/properties')) return 'Properties & Units Management';
    if (path.includes('/tenants')) return 'Tenants & Rental Leases';
    if (path.includes('/invoices')) return 'Monthly Invoices & Billing';
    if (path.includes('/payments')) return 'Financial Payment Ledger';
    if (path.includes('/maintenance')) return 'Maintenance & Repair Requests';
    if (path.includes('/settings')) return 'Payout & Account Settings';
    return 'Landlord Overview & KPIs';
  };

  return (
    <>
      {/* 1. NATIVE MOBILE SCREENS (< 1024px) - ALWAYS FULLSCREEN NATIVE APP */}
      <div className="lg:hidden min-h-screen bg-slate-100 flex flex-col text-slate-800">
        <LandlordMobileHeader viewMode={viewMode} onToggleViewMode={toggleViewMode} />
        <main className="flex-1 px-4 py-5 pb-24 overflow-y-auto">
          {children}
        </main>
        <LandlordBottomNav isInsideFrame={false} />
      </div>

      {/* 2. DESKTOP SCREENS (>= 1024px) */}
      <div className="hidden lg:block min-h-screen">
        {viewMode === 'APP' ? (
          /* SMARTPHONE APP FRAME PREVIEW ON DESKTOP */
          <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 flex flex-col items-center justify-start select-none">
            {/* Top Mode Switcher Bar */}
            <div className="mb-6 flex items-center justify-between gap-4 max-w-[420px] w-full bg-slate-800/80 border border-slate-700/80 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 pl-2 text-xs font-bold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Landlord Mobile App View</span>
              </div>
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 active:scale-95 text-xs font-bold text-white transition"
                title="Expand to Full Desktop Portal"
              >
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span>Desktop Mode</span>
              </button>
            </div>

            {/* Smartphone Device Frame */}
            <div className="max-w-[420px] w-full h-[860px] bg-slate-50 rounded-[50px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] relative flex flex-col overflow-hidden ring-1 ring-white/10">
              {/* iPhone Status Bar */}
              <div className="bg-slate-900 text-white px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold select-none shrink-0">
                <span>9:41</span>
                {/* Dynamic Island / Notch */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold">5G</span>
                  <Battery className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Mobile Header Inside Phone Frame */}
              <LandlordMobileHeader viewMode={viewMode} onToggleViewMode={toggleViewMode} />

              {/* Scrollable Mobile App Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 text-slate-800 select-text">
                {children}
              </div>

              {/* In-Frame Bottom Navigation Bar */}
              <LandlordBottomNav isInsideFrame={true} />
            </div>
          </div>
        ) : (
          /* FULL WIDESCREEN DESKTOP PORTAL */
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header
                title={getPageTitle(pathname)}
                viewMode={viewMode}
                onToggleViewMode={toggleViewMode}
              />
              <main className="p-8 flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
