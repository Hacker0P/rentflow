'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
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
} from 'lucide-react';
import { getAuthToken, getStoredUser, setAuthToken, setStoredUser, apiRequest } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingInRole, setLoggingInRole] = useState<'LANDLORD' | 'TENANT' | null>(null);

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

  const quickDemoLogin = async (role: 'LANDLORD' | 'TENANT') => {
    setLoggingInRole(role);
    try {
      const email = role === 'LANDLORD' ? 'rahul.sharma@example.com' : 'amit.kumar@example.com';
      const password = 'Password123!';

      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.data) {
        setAuthToken(res.data.accessToken);
        setStoredUser(res.data.user);
        if (role === 'LANDLORD') {
          router.push('/dashboard');
        } else {
          router.push('/tenant');
        }
      }
    } catch (err) {
      console.error('Demo login failed:', err);
      router.push('/login');
    } finally {
      setLoggingInRole(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Opening RentFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-30 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-tight">
                RentFlow
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                Dual-Sided Rental SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white transition px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 space-y-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Modern Landlords & Salaried Tenants</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Rent & Maintenance Collection,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Effortlessly Solved.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Say goodbye to chasing rent over awkward phone calls and Excel sheets. Instant UPI payments, WhatsApp invoice reminders, automatic HRA tax receipts with Landlord PAN, and live repair tracking.
          </p>

          {/* Quick 1-Click Interactive Demo Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => quickDemoLogin('LANDLORD')}
              disabled={loggingInRole !== null}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 transition flex items-center justify-center gap-2.5 group"
            >
              <Building2 className="w-4 h-4 text-emerald-200" />
              <span>
                {loggingInRole === 'LANDLORD' ? 'Launching Command Center...' : 'Try Live Landlord Portal'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => quickDemoLogin('TENANT')}
              disabled={loggingInRole !== null}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-white font-bold text-sm border border-slate-700 backdrop-blur-md transition flex items-center justify-center gap-2.5 group"
            >
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>
                {loggingInRole === 'TENANT' ? 'Launching Tenant App...' : 'Try Mobile Tenant Portal'}
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pre-seeded test accounts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No setup required
            </span>
          </div>
        </div>

        {/* Feature Grid: 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-4 hover:border-emerald-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Instant UPI & Direct Bank Transfers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tenants scan a dynamic QR code prefilled with their exact balance or tap to launch GPay, PhonePe, or Paytm. 0% gateway fees go straight into your bank.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-4 hover:border-teal-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">HRA Tax Proofs & 1-Click Annual Summary</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Section 10(13A) compliant rent receipts generated instantly with the landlord&apos;s PAN. Tenants can print 12-month consolidated declarations for company HR.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-4 hover:border-cyan-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Maintenance & Repair Request Desk</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tenants report plumbing, electrical, or appliance issues with photos and urgency tags. Landlords track progress from Open to Resolved in one dashboard.
            </p>
          </div>
        </div>

        {/* Dual Sided Experience Preview Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-white/10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              The Complete Ecosystem
            </span>
            <h2 className="text-3xl font-black text-white">Built For Both Sides of the Rental Lease</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  For Landlords
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Command Center
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time collection meter & occupancy rate</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-click WhatsApp payment reminders with bill link</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-click CSV ledger export for income tax & CA audit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom UPI ID and PAN configuration in Settings</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  For Tenants
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Mobile App
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Clean balance card with due date countdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Direct UPI app launch (GPay / PhonePe / Paytm)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Official HRA receipts with Landlord PAN</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>1-tap repair requests & direct WhatsApp landlord connect</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 border-t border-white/10 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RentFlow Platform. Modern Property & Rent Management.</p>
        </footer>
      </main>
    </div>
  );
}
