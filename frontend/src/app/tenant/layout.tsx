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
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getAuthToken, getStoredUser, clearAuthToken, apiRequest, setAuthToken, setStoredUser } from '@/lib/api';
import { NotificationBell } from '@/components/layout/notification-bell';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  const handleSwitchToLandlordDemo = async () => {
    try {
      setSwitching(true);
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'rahul.sharma@example.com',
          password: 'Password123!',
        }),
      });
      if (res.data) {
        setAuthToken(res.data.accessToken);
        setStoredUser(res.data.user);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Switch to landlord demo failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Opening Tenant App...</p>
        </div>
      </div>
    );
  }

  const isDemo = user?.email === 'amit.kumar@example.com';

  const navItems = [
    { label: 'Home & Pay', href: '/tenant', icon: Home },
    { label: 'Receipts & HRA', href: '/tenant/receipts', icon: Receipt },
    { label: 'Repairs & Support', href: '/tenant/maintenance', icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-800 pb-20 md:pb-8">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-teal-950/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-none">
                  RentFlow
                </span>
                {isDemo && (
                  <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-800 border border-teal-500/40 text-[9px] font-black uppercase tracking-wider">
                    Demo
                  </span>
                )}
              </div>
              <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block mt-0.5">
                Tenant Portal
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            {isDemo && (
              <button
                onClick={handleSwitchToLandlordDemo}
                disabled={switching}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{switching ? 'Opening...' : 'Landlord View'}</span>
              </button>
            )}

            <NotificationBell variant="light" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                {user?.name ? user.name[0].toUpperCase() : 'T'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {user?.name || 'Tenant'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-4 pt-4 flex-1">
        {/* Demo Switcher Banner for Tenant Mobile */}
        {isDemo && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-teal-950/90 via-slate-900 to-emerald-950/90 border border-teal-500/30 text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-black block leading-tight text-teal-300">
                  Demo: Amit Kumar (Tenant)
                </span>
                <span className="text-[10px] text-slate-400">Flat 302 • ₹18,000 Due</span>
              </div>
            </div>
            <button
              onClick={handleSwitchToLandlordDemo}
              disabled={switching}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-md transition shrink-0"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{switching ? 'Opening...' : 'Landlord Demo'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-2 pb-3.5 z-40 flex items-center justify-around shadow-2xl select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition active:scale-95 ${
                active ? 'text-teal-700 font-extrabold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  active ? 'bg-teal-500/15 text-teal-700' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
