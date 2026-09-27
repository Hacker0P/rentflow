'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LogOut,
  Wrench,
  CreditCard,
  User,
  X,
  ArrowRight,
  Settings,
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
      <header className="lg:hidden bg-slate-950/95 backdrop-blur-md text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/60 border border-emerald-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight leading-none block">
                RentFlow
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mt-0.5">
                Landlord Portal
              </span>
            </div>
          </Link>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell variant="dark" />

            {/* Quick link to Maintenance */}
            <Link
              href="/dashboard/maintenance"
              title="Repair Tickets"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
            </Link>

            {/* Quick link to Payments */}
            <Link
              href="/dashboard/payments"
              title="Payment Ledger"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </Link>

            {/* Profile Avatar & Menu Toggle */}
            <button
              onClick={() => setShowMenu(true)}
              title="Account Menu"
              className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 active:scale-95 transition"
            >
              {user?.name ? user.name[0].toUpperCase() : 'L'}
            </button>
          </div>
        </div>
      </header>

      {/* Account Menu Sheet / Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'L'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{user?.name || 'Landlord'}</h4>
                  <span className="text-[11px] text-slate-400">{user?.email}</span>
                </div>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="space-y-1 text-xs font-semibold text-slate-300">
              <Link
                href="/dashboard/settings"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Payout & UPI Settings</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/dashboard/maintenance"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Repair Ticket Desk</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/dashboard/payments"
                onClick={() => setShowMenu(false)}
                className="w-full p-3 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  <span>Payments & Invoices</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-bold text-xs border border-rose-500/20 flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of RentFlow</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
