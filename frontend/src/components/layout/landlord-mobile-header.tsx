'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LogOut,
  Wrench,
  CreditCard,
  Smartphone,
  Monitor,
  Bell,
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

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  return (
    <header className="lg:hidden bg-slate-900 text-white sticky top-0 z-30 border-b border-slate-800 shadow-md">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              RentFlow
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
              Landlord App
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
            title="Repairs Desk"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
          </Link>

          {/* Quick link to Payments */}
          <Link
            href="/dashboard/payments"
            title="Payment Ledger"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </Link>

          {/* Profile & Logout */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0"
          >
            {user?.name ? user.name[0].toUpperCase() : 'L'}
          </button>
        </div>
      </div>
    </header>
  );
}
