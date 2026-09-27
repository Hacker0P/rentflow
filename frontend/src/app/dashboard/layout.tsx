'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
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
  const [viewMode, setViewMode] = useState<'APP' | 'FULL'>('APP');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    } else {
      const saved = localStorage.getItem('rentflow_landlord_view_mode') as 'APP' | 'FULL' | null;
      if (saved) {
        setViewMode(saved);
      } else {
        setViewMode('APP'); // Mobile app view by default!
      }
      setMounted(true);
    }
  }, [router]);

  const toggleViewMode = () => {
    const next = viewMode === 'APP' ? 'FULL' : 'APP';
    setViewMode(next);
    localStorage.setItem('rentflow_landlord_view_mode', next);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">Loading RentFlow app...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. NATIVE MOBILE APP EXPERIENCE (< 1024px screens) */}
      <div className="lg:hidden min-h-screen bg-slate-50 flex flex-col text-slate-900 relative">
        <LandlordMobileHeader viewMode={viewMode === 'APP' ? 'APP' : 'DESKTOP'} onToggleViewMode={toggleViewMode} />
        <main className="flex-1 px-4 py-4 pb-28 overflow-y-auto">
          {children}
        </main>
        <LandlordBottomNav isInsideFrame={false} />
      </div>

      {/* 2. DESKTOP SCREENS (>= 1024px) */}
      <div className="hidden lg:block min-h-screen bg-slate-950 text-slate-100">
        {viewMode === 'APP' ? (
          /* CENTERED SMARTPHONE DEVICE FRAME ON DESKTOP */
          <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-center select-none relative overflow-hidden">
            {/* Subtle Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Device Hint & Toggle */}
            <div className="mb-4 flex items-center justify-between gap-4 max-w-[430px] w-full bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-md z-10">
              <div className="flex items-center gap-2 pl-2 text-xs font-semibold text-slate-300">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>RentFlow Mobile App</span>
              </div>
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                title="Expand Viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Width</span>
              </button>
            </div>

            {/* Smartphone Device Frame */}
            <div className="max-w-[430px] w-full h-[880px] bg-slate-50 rounded-[50px] border-[10px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-white/10 z-10">
              {/* Native iOS/Android Status Bar */}
              <div className="bg-white text-slate-900 px-7 pt-3.5 pb-1 flex items-center justify-between text-[11px] font-bold select-none shrink-0 border-b border-slate-100">
                <span>9:41</span>
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-slate-700" />
                  <span className="text-[10px] font-bold text-slate-700">5G</span>
                  <Battery className="w-3.5 h-3.5 text-slate-700" />
                </div>
              </div>

              {/* Mobile Header Inside Phone Frame */}
              <LandlordMobileHeader viewMode="APP" onToggleViewMode={toggleViewMode} />

              {/* Scrollable Mobile App Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 text-slate-900 select-text">
                {children}
              </div>

              {/* In-Frame Bottom Navigation Bar */}
              <LandlordBottomNav isInsideFrame={true} />
            </div>
          </div>
        ) : (
          /* RESPONSIVE APP VIEWPORT (CENTERED ON DESKTOP) */
          <div className="min-h-screen bg-slate-900 py-6 px-4 flex flex-col items-center justify-start select-none">
            {/* Top Switcher Bar */}
            <div className="mb-4 flex items-center justify-between gap-4 max-w-xl w-full bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 pl-2 text-xs font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Mobile App View</span>
              </div>
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Device Mockup</span>
              </button>
            </div>

            {/* Mobile-Centered Container */}
            <div className="max-w-xl w-full min-h-[90vh] bg-slate-50 rounded-3xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden text-slate-900">
              <LandlordMobileHeader viewMode="DESKTOP" onToggleViewMode={toggleViewMode} />
              <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 select-text">
                {children}
              </div>
              <LandlordBottomNav isInsideFrame={true} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
