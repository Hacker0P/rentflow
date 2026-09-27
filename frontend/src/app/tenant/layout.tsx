'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Home,
  Receipt,
  Wrench,
  LogOut,
  ChevronDown,
  X,
  ShieldCheck,
  Smartphone,
  Download,
} from 'lucide-react';
import { getAuthToken, getStoredUser, clearAuthToken } from '@/lib/api';
import { NotificationBell } from '@/components/layout/notification-bell';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const stored = getStoredUser();

    if (!token) {
      router.push('/login');
      return;
    }

    if (stored?.role === 'LANDLORD') {
      router.push('/dashboard');
      return;
    }

    setUser(stored);
    setMounted(true);
  }, [router]);

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Opening Tenant Portal...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Home & Pay', href: '/tenant', icon: Home },
    { label: 'Receipts', href: '/tenant/receipts', icon: Receipt },
    { label: 'Repairs', href: '/tenant/maintenance', icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex justify-center selection:bg-blue-600 selection:text-white">
      {/* Centered Mobile App Viewport */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 shadow-2xl relative flex flex-col border-x border-slate-200/80">
        {/* Native Mobile App Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-4 h-15 flex items-center justify-between shadow-xs">
          <Link href="/tenant" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-none">
                RentFlow
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                Resident App
              </span>
            </div>
          </Link>

          {/* User Profile & Notifications */}
          <div className="flex items-center gap-2">
            <NotificationBell variant="light" />

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition active:scale-95"
              title="My Account"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {user?.name ? user.name[0].toUpperCase() : 'T'}
              </div>
              <span className="text-xs font-semibold text-slate-700 max-w-[70px] truncate">
                {user?.name ? user.name.split(' ')[0] : 'Resident'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Body with Bottom Safe Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 text-slate-900">
          {children}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 max-w-md w-full z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg shadow-slate-900/10 select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition active:scale-90 text-center ${
                  active ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active ? 'bg-blue-50 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Bottom Sheet Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in">
            <div className="bg-white border-t border-slate-200 text-slate-900 rounded-t-[32px] w-full max-w-md p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-safe">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold text-base shadow-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'T'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">
                      {user?.name || 'Resident'}
                    </h4>
                    <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                      {user?.email || 'Registered Resident'}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Active Tenant
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Links */}
              <div className="space-y-1.5 pt-1">
                <Link
                  href="/tenant"
                  onClick={() => setShowProfileModal(false)}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Home &amp; Monthly Rent</span>
                      <span className="text-[10px] text-slate-400">View bill &amp; pay via UPI</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                </Link>

                <Link
                  href="/tenant/receipts"
                  onClick={() => setShowProfileModal(false)}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Rent Receipts</span>
                      <span className="text-[10px] text-slate-400">HRA Tax claims &amp; history</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                </Link>

                <Link
                  href="/tenant/maintenance"
                  onClick={() => setShowProfileModal(false)}
                  className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Repairs &amp; Support</span>
                      <span className="text-[10px] text-slate-400">Log issues for landlord</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                </Link>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
