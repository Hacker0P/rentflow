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
} from 'lucide-react';
import { getAuthToken, getStoredUser, clearAuthToken } from '@/lib/api';
import { NotificationBell } from '@/components/layout/notification-bell';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

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
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Opening Tenant App...</p>
        </div>
      </div>
    );
  }

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
              <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-none">
                RentFlow
              </span>
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
