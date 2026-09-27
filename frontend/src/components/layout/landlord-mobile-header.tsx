'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2,
  LogOut,
  Wrench,
  CreditCard,
  X,
  ArrowRight,
  Settings,
  ChevronDown,
  ShieldCheck,
  Building,
  Users,
  Smartphone,
  Download,
} from 'lucide-react';
import { NotificationBell } from './notification-bell';
import { getStoredUser, clearAuthToken } from '@/lib/api';

interface LandlordMobileHeaderProps {
  viewMode: 'APP' | 'DESKTOP';
  onToggleViewMode: () => void;
}

export function LandlordMobileHeader({
  viewMode,
  onToggleViewMode,
}: LandlordMobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  return (
    <>
      <header className="lg:hidden bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 border-b border-slate-200/80 shadow-xs">
        <div className="px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/10 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight leading-none block">
                RentFlow
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                Landlord Portal
              </span>
            </div>
          </Link>

          {/* Quick Actions & Profile Chip */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell variant="light" />

            {/* Profile Avatar / Settings Chip Button */}
            <button
              onClick={() => setShowMenu(true)}
              title="Settings & Profile"
              className={`flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full border transition active:scale-95 ${
                pathname === '/dashboard/settings'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200'
              }`}
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'L'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-800 text-white flex items-center justify-center border border-white">
                  <Settings className="w-1.5 h-1.5 text-emerald-300" />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800 max-w-[85px] truncate">
                {user?.name ? user.name.split(' ')[0] : 'Settings'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Account Menu Sheet / Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            {/* Drag Handle on Mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1 mb-1 sm:hidden" />

            {/* User Profile Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-base shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'L'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{user?.name || 'Landlord'}</h4>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">{user?.email}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Landlord
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent Featured Settings Card */}
            <Link
              href="/dashboard/settings"
              onClick={() => setShowMenu(false)}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50/30 border border-emerald-200/90 flex items-center justify-between transition hover:shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-slate-900 text-xs">Settings & Payouts</span>
                  <span className="text-[11px] text-slate-500 font-medium">QR photo, UPI ID, Bank accounts</span>
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition">
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Other Navigation Shortcuts */}
            <div className="space-y-1 text-xs font-semibold text-slate-700 pt-1">

              <Link
                href="/dashboard/properties"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between transition border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-800">Properties & Units</span>
                    <span className="text-[10px] text-slate-400 font-normal">Manage buildings and rental flats</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/tenants"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between transition border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-800">Tenants & Leases</span>
                    <span className="text-[10px] text-slate-400 font-normal">Agreements and resident directory</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/maintenance"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between transition border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-800">Repair Ticket Desk</span>
                    <span className="text-[10px] text-slate-400 font-normal">Track tenant maintenance requests</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>

            {/* Install App on Phone Button */}
            <button
              onClick={() => {
                setShowMenu(false);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('rentflow-trigger-pwa-install'));
                }
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs border border-emerald-200/80 flex items-center justify-between transition active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900 leading-tight">Install Mobile App</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Add to Home Screen</span>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out of RentFlow</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
