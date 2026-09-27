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
    <header className="hidden lg:flex h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* In-App Notification Center */}
        <NotificationBell variant="light" />

        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition active:scale-95 shadow-xs"
            title="Toggle between Mobile App View and Desktop View"
          >
            {viewMode === 'APP' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-600" />
                <span>Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Mobile Preview</span>
              </>
            )}
          </button>
        )}

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition active:scale-95 shadow-xs"
          title="Account & Payout Settings"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name[0].toUpperCase() : 'L'}
          </div>
          <div className="text-left text-xs pr-1">
            <span className="font-semibold text-slate-800 block leading-tight">{user?.name || 'Landlord'}</span>
            <span className="text-[10px] text-blue-700 flex items-center gap-1 font-medium">
              <UserCheck className="w-3 h-3 text-blue-600" />
              Verified
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
