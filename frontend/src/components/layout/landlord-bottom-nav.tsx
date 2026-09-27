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
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Properties', href: '/dashboard/properties', icon: Building2 },
    { label: 'Tenants', href: '/dashboard/tenants', icon: Users },
    { label: 'Bills', href: '/dashboard/invoices', icon: ReceiptText },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const positionClass = isInsideFrame
    ? 'absolute bottom-0 left-0 right-0'
    : 'fixed bottom-0 left-0 right-0';

  return (
    <nav
      className={`${positionClass} z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg shadow-slate-900/10 select-none`}
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
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition active:scale-90 text-center ${
              isActive
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-blue-50 text-blue-600 shadow-xs' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
