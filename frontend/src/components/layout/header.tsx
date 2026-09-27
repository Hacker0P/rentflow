'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredUser } from '@/lib/api';
import { UserCheck, Smartphone, Monitor } from 'lucide-react';
import { NotificationBell } from './notification-bell';

interface HeaderProps {
  title: string;
  viewMode?: 'APP' | 'DESKTOP';
  onToggleViewMode?: () => void;
}

export function Header({ title, viewMode = 'DESKTOP', onToggleViewMode }: HeaderProps) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <header className="hidden lg:flex h-16 bg-white border-b border-slate-200/80 px-8 items-center justify-between sticky top-0 z-10 shadow-sm/50">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* In-App Notification Center */}
        <NotificationBell variant="light" />

        {onToggleViewMode && (

          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition active:scale-95 shadow-xs"
            title="Toggle between Mobile App View and Desktop View"
          >
            {viewMode === 'APP' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                <span>Switch to Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Switch to Mobile App View</span>
              </>
            )}
          </button>
        )}

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition active:scale-95 shadow-xs"
          title="Account & Payout Settings"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'L'}
          </div>
          <div className="text-left text-xs pr-1">
            <span className="font-bold text-slate-800 block leading-tight">{user?.name || 'Landlord'}</span>
            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
              <UserCheck className="w-3 h-3 text-emerald-600" />
              Verified Landlord
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
