'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Home,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  FileText,
  Wrench,
  Users,
  CreditCard,
  Sparkles,
  ChevronRight,
  Smartphone,
  Zap,
  Lock,
  Receipt,
  UserCheck,
  MessageCircle,
  Download,
} from 'lucide-react';
import { getAuthToken, getStoredUser } from '@/lib/api';
import { PwaInstaller } from '@/components/pwa/pwa-installer';

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (token && user) {
      if (user.role === 'TENANT') {
        router.push('/tenant');
      } else {
        router.push('/dashboard');
      }
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-400">Opening RentFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Ambient Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main App Container (Centered on desktop, fullscreen on mobile) */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between p-4 sm:p-6 pb-safe z-10">
        {/* Top App Bar */}
        <header className="flex items-center justify-between pt-2 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-950/60 border border-blue-400/20">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white leading-none">
                  RentFlow
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  India
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Smart Rental Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 shadow-xs"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-950 hover:bg-blue-500 transition active:scale-95"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* Central App Hero & Feature Stack */}
        <div className="my-auto py-4 space-y-5">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Real-Estate Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Manage &amp; Collect Rent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                Directly on UPI.
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Zero-commission bank settlements, automated WhatsApp slips, verified rent receipts, and live repair tracking.
            </p>
          </div>

          {/* Highlight Badge */}
          <div className="flex justify-center">
            <div className="bg-slate-900 text-slate-200 px-4 py-2 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                ₹
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold block text-white leading-none">
                  Direct Bank UPI Mode
                </span>
                <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider block mt-0.5">
                  0% Gateway Commission
                </span>
              </div>
            </div>
          </div>

          {/* Real Mobile App Feature Cards */}
          <div className="space-y-2.5 pt-1">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/30">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Instant UPI &amp; QR Payments</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  1-tap payments via GPay, PhonePe, or Paytm straight into your bank.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/30">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">1-Tap WhatsApp Slips &amp; Receipts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Send polite rent reminders and instant payment confirmation slips.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/30">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Verified Rent Receipts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  HRA-compliant digital receipts created automatically upon settlement.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/30">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Live Repair Ticket Desk</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Submit maintenance requests and track landlord progress in real time.
                </p>
              </div>
            </div>
          </div>

          {/* PWA Install Banner */}
          <div className="pt-1">
            <PwaInstaller />
          </div>
        </div>

        {/* Bottom App Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/register"
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold p-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black block leading-tight">
                  Get Started Free
                </span>
                <span className="text-[10px] text-blue-100 font-semibold block">
                  Create Landlord or Tenant Account
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white shrink-0" />
          </Link>

          <Link
            href="/login"
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 border border-slate-800 text-white font-bold p-3.5 rounded-2xl transition flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-black">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black block leading-tight">
                  Sign In to Existing Account
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Access via Phone OTP, Password, or Google
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>

          <div className="pt-2 text-center text-[10px] text-slate-500">
            <span>© {new Date().getFullYear()} RentFlow India • Direct Bank UPI • Verified Receipts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
