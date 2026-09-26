'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Users,
  ReceiptText,
  CreditCard,
  LogOut,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { clearAuthToken, getStoredUser } from '@/lib/api';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Properties & Units',
      href: '/dashboard/properties',
      icon: Building2,
    },
    {
      label: 'Tenants & Leases',
      href: '/dashboard/tenants',
      icon: Users,
    },
    {
      label: 'Invoices & Billing',
      href: '/dashboard/invoices',
      icon: ReceiptText,
    },
    {
      label: 'Payment Ledger',
      href: '/dashboard/payments',
      icon: CreditCard,
    },
    {
      label: 'Maintenance & Repairs',
      href: '/dashboard/maintenance',
      icon: Wrench,
    },
    {
      label: 'Payouts & Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-300 flex-col shrink-0 min-h-screen border-r border-slate-900 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-950">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              RentFlow
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
              Landlord Hub
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="p-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Sign Out */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'L'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-white block truncate leading-tight">
              {user?.name || 'Rahul Sharma'}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              {user?.email || 'Landlord'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
