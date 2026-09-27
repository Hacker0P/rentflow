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
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
                RentFlow
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                Landlord Hub
              </span>
            </div>
          </Link>

          {/* Quick Actions & Profile Chip */}
          <div className="flex items-center gap-2">
            <NotificationBell variant="light" />

            {/* Profile Avatar / Settings Chip Button */}
            <button
              onClick={() => setShowMenu(true)}
              title="Settings & Profile"
              className={`flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full border transition active:scale-95 ${
                pathname === '/dashboard/settings'
                  ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'L'}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[85px] truncate">
                {user?.name ? user.name.split(' ')[0] : 'Menu'}
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
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold text-base shadow-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'L'}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm leading-tight">{user?.name || 'Landlord'}</h4>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">{user?.email}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    <ShieldCheck className="w-3 h-3 text-blue-600" /> Verified Landlord
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
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-semibold text-slate-900 text-xs">Settings & Payouts</span>
                  <span className="text-[11px] text-slate-500">QR photo, UPI ID, Bank accounts</span>
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-white text-slate-600 border border-slate-200 flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition">
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Other Navigation Shortcuts */}
            <div className="space-y-1 text-xs font-medium text-slate-700 pt-1">
              <Link
                href="/dashboard/properties"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between transition border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-800">Properties & Units</span>
                    <span className="text-[10px] text-slate-400 font-normal">Buildings and rental units</span>
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
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-800">Tenants & Leases</span>
                    <span className="text-[10px] text-slate-400 font-normal">Resident directory and contracts</span>
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
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-800">Maintenance Desk</span>
                    <span className="text-[10px] text-slate-400 font-normal">Tenant repair tickets</span>
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
              className="w-full py-2.5 px-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-semibold text-xs border border-blue-200/80 flex items-center justify-between transition active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-slate-900 leading-tight">Install Mobile App</span>
                  <span className="text-[10px] text-blue-700">Add to Home Screen</span>
                </div>
              </div>
              <Download className="w-4 h-4 text-blue-600" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200/80 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
