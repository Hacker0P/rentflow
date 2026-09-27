'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  ReceiptText,
  Settings,
} from 'lucide-react';

export function LandlordBottomNav({ isInsideFrame = false }: { isInsideFrame?: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Units', href: '/dashboard/properties', icon: Building2 },
    { label: 'Tenants', href: '/dashboard/tenants', icon: Users },
    { label: 'Billing', href: '/dashboard/invoices', icon: ReceiptText },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const positionClass = isInsideFrame
    ? 'absolute bottom-0 left-0 right-0'
    : 'fixed bottom-0 left-0 right-0 lg:hidden';

  return (
    <nav
      className={`${positionClass} z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2 pt-2 pb-3.5 sm:pb-2 flex items-center justify-around shadow-2xl shadow-slate-900/10 select-none`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition active:scale-95 ${
              isActive
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition ${
                isActive ? 'bg-emerald-500/15 text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
