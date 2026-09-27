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
  ChevronDown,
  X,
  ShieldCheck,
  Phone,
  Mail,
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
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/tenant" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-teal-950/10 border border-teal-500/20 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight text-base block leading-none">
                RentFlow
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                Tenant Portal
              </span>
            </div>
          </Link>

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

          {/* User Profile & Actions in Header */}
          <div className="flex items-center gap-2">
            <NotificationBell variant="light" />

            {/* Profile Section Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition active:scale-95"
              title="My Account & Profile"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {user?.name ? user.name[0].toUpperCase() : 'T'}
              </div>
              <span className="text-xs font-bold text-slate-700 max-w-[85px] truncate hidden sm:inline">
                {user?.name ? user.name.split(' ')[0] : 'Resident'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Section Modal / Bottom Sheet */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

            {/* Profile Info Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'T'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">
                    {user?.name || 'Resident'}
                  </h4>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                    {user?.email || 'Registered Tenant'}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    <ShieldCheck className="w-3 h-3 text-teal-600" /> Verified Resident
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
            <div className="space-y-2 pt-1">
              <Link
                href="/tenant"
                onClick={() => setShowProfileModal(false)}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Home & Monthly Rent</span>
                    <span className="text-[10px] text-slate-400">View bill & pay via UPI</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400 group-hover:text-slate-600" />
              </Link>

              <Link
                href="/tenant/receipts"
                onClick={() => setShowProfileModal(false)}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Receipts & HRA Claims</span>
                    <span className="text-[10px] text-slate-400">Tax declaration certificates</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400 group-hover:text-slate-600" />
              </Link>

              <Link
                href="/tenant/maintenance"
                onClick={() => setShowProfileModal(false)}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Repairs & Maintenance</span>
                    <span className="text-[10px] text-slate-400">Track technician visits</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400 group-hover:text-slate-600" />
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  handleLogout();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out from RentFlow</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
