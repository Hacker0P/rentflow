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
  ArrowUpRight,
  Clock,
  Send,
  Download,
  PhoneCall,
  FileSpreadsheet,
  Layers,
  Shield,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import { getAuthToken, getStoredUser } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activePreviewTab, setActivePreviewTab] = useState<'LANDLORD' | 'TENANT'>('LANDLORD');

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Opening RentFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. NATIVE MOBILE APP VIEW (< md screens)                                 */}
      {/* ========================================================================= */}
      <div className="md:hidden min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 pb-8 selection:bg-emerald-500 selection:text-white">
        {/* Top App Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/60 p-2 border border-emerald-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                  RentFlow
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  India
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                Smart Rental Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-950 hover:bg-emerald-500 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Central Visual App Hero & Feature Pills */}
        <div className="my-auto py-5 space-y-5">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Real-Estate Management</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
              Manage, Collect & Pay Rent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Effortlessly.
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Direct UPI payments, WhatsApp reminder slips, verified rent receipts, and live repair tickets.
            </p>
          </div>

          {/* Real App Feature Cards Stack */}
          <div className="space-y-2.5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/40">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Instant UPI & QR Payments</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  1-tap payment via GPay, PhonePe, or Paytm straight to your bank.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/40">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">1-Tap WhatsApp Slips & Receipts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Send polite rent reminders and instant payment confirmation receipts.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-black/40">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white">Live Repair Ticket Desk</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Submit maintenance requests and track progress with live updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom App Actions: Real Sign In & Register */}
        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-98 text-slate-950 font-bold p-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 font-black">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black block leading-tight">
                  Sign In to Your Account
                </span>
                <span className="text-[10px] text-slate-900/80 font-semibold block">
                  For Property Owners & Residents
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
          </Link>

          <Link
            href="/register"
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 border border-slate-700/80 text-white font-bold p-3.5 rounded-2xl transition flex items-center justify-between shadow-lg shadow-black/30"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black block leading-tight">
                  Create Landlord Account
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Get started free in 2 minutes
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP SAAS MARKETING VIEW (>= md screens)                            */}
      {/* ========================================================================= */}
      <div className="hidden md:block min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white">
        {/* Navigation Header */}
        <header className="border-b border-white/10 backdrop-blur-xl sticky top-0 z-40 bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white block leading-tight">
                  RentFlow
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  Rental & Property Platform
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-8 text-xs font-semibold text-slate-300">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#showcase" className="hover:text-white transition">Product Preview</a>
              <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-300 hover:text-white transition px-4 py-2.5 rounded-xl hover:bg-slate-900/60"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 space-y-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Built for Modern Indian Landlords & Salaried Tenants</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Stop Chasing Rent.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Collect Automatically.
              </span>
            </h1>

            <p className="text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Say goodbye to awkward calls, scattered WhatsApp receipts, and Excel sheets. RentFlow powers instant zero-fee UPI collections, automated WhatsApp invoices, verified payment receipts, and live repair tracking.
            </p>

            {/* Clean Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 transition flex items-center justify-center gap-2.5 group"
              >
                <span>Create Free Landlord Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-sm border border-slate-700/80 transition flex items-center justify-center gap-2.5 group shadow-lg"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Sign In to Portal</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 0% Gateway Fees (100% directly to your bank)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant 1-Tap WhatsApp Slips
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Rent Payment Receipts
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Interactive Live Showcase Box (Tabbed View: Landlord vs Tenant)           */}
          {/* ========================================================================= */}
          <div id="showcase" className="pt-4 scroll-mt-24">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
              {/* Showcase Header with Switcher */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Product Preview
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Feature Tour
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    See How RentFlow Works for Both Sides
                  </h3>
                </div>

                <div className="p-1 bg-slate-950 rounded-2xl flex items-center border border-slate-800 shrink-0">
                  <button
                    onClick={() => setActivePreviewTab('LANDLORD')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activePreviewTab === 'LANDLORD'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Landlord Portal</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('TENANT')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activePreviewTab === 'TENANT'
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Tenant Portal</span>
                  </button>
                </div>
              </div>

              {/* Showcase Body */}
              <div className="pt-6">
                {activePreviewTab === 'LANDLORD' ? (
                  <div className="space-y-6">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Total Expected Rent
                        </span>
                        <div className="text-2xl font-black text-white mt-1">₹42,000</div>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> Across 2 Units
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Collected Meter
                        </span>
                        <div className="text-2xl font-black text-emerald-400 mt-1">₹24,000</div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '57%' }} />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Occupancy Rate
                        </span>
                        <div className="text-2xl font-black text-white mt-1">100%</div>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          2 of 2 Units Occupied
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Pending Balance
                        </span>
                        <div className="text-2xl font-black text-amber-400 mt-1">₹18,000</div>
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> 1 Due Invoice
                        </span>
                      </div>
                    </div>

                    {/* Unit Bills Showcase */}
                    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Active Property Collections
                        </span>
                        <span className="text-[11px] text-slate-400">Sunshine Heights</span>
                      </div>

                      <div className="divide-y divide-slate-800/80 text-xs">
                        <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                              302
                            </div>
                            <div>
                              <div className="font-bold text-white">Flat 302, Sunshine Heights</div>
                              <div className="text-[11px] text-slate-400">Tenant: Amit Kumar • ₹18,000/mo</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Payment Due
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] flex items-center gap-1 border border-emerald-500/20">
                              <MessageCircle className="w-3 h-3" /> 1-Tap WhatsApp Reminder
                            </span>
                          </div>
                        </div>

                        <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                              101
                            </div>
                            <div>
                              <div className="font-bold text-white">Flat 101, Sunshine Heights</div>
                              <div className="text-[11px] text-slate-400">Tenant: Priya Singh • ₹24,000/mo</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Paid via UPI
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-[11px] flex items-center gap-1">
                              <Download className="w-3 h-3 text-teal-400" /> Receipt Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400">
                        Ready to automate your properties?
                      </span>
                      <Link
                        href="/login"
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-4"
                      >
                        Sign In to Landlord Dashboard <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto space-y-4">
                    {/* Tenant Mobile Preview Card */}
                    <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                            Current Stay
                          </span>
                          <h4 className="text-base font-bold text-white">Flat 302, Green Acres</h4>
                          <span className="text-xs text-slate-400">Landlord: Rahul Sharma</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Due 5th of Month
                        </span>
                      </div>

                      {/* Balance Hero */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">Total Amount Due</span>
                          <span className="text-3xl font-black text-white">₹18,000</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                          <QrCode className="w-6 h-6" />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2.5">
                        <div className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                          <QrCode className="w-4 h-4" />
                          <span>Pay via UPI (GPay / PhonePe / Paytm)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold flex items-center justify-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Rent Receipts</span>
                          </div>
                          <div className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold flex items-center justify-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-400" />
                            <span>Request Repair</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <Link
                        href="/login"
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 underline underline-offset-4"
                      >
                        Sign In to Tenant Portal <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Feature Grid: 4 Core Pillars                                              */}
          {/* ========================================================================= */}
          <div id="features" className="space-y-12 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Engineered for Simplicity
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Everything You Need, Nothing You Don&apos;t
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Streamline rent collection, repairs, and tenant relationships across your properties.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3 hover:border-emerald-500/40 transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">0% Fee Direct UPI</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dynamic QR codes prefilled with exact balance. Money transfers directly to your bank account without gateway commissions.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3 hover:border-teal-500/40 transition">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">1-Click WhatsApp Invoices</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send polite, professional WhatsApp rent reminders with 1 tap. Pre-formatted with unit number, due date, and payment link.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3 hover:border-cyan-500/40 transition">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Verified Rent Receipts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic payment receipts generated with every settlement. Tenants can view, print, or share receipts via WhatsApp anytime.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3 hover:border-indigo-500/40 transition">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Live Repair Desk</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No more forgotten repairs lost in WhatsApp chats. Tenants submit issues with urgency tags and category filters for transparent tracking.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* How It Works (3 Steps)                                                    */}
          {/* ========================================================================= */}
          <div id="how-it-works" className="space-y-12 scroll-mt-24">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Effortless Setup
              </span>
              <h2 className="text-3xl font-black text-white">How It Works in 3 Simple Steps</h2>
              <p className="text-xs text-slate-400">No complex onboarding. Up and running in under 2 minutes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h4 className="text-lg font-bold text-white">Add Properties & Tenants</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your property name, flat units, and tenant contact details with monthly rent amount and due day.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h4 className="text-lg font-bold text-white">Dispatch 1-Tap Reminders</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate monthly bills with 1 click. Tap &apos;Send WhatsApp&apos; to dispatch polite reminder slips directly to tenants.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h4 className="text-lg font-bold text-white">Rent Deposited & Receipts Issued</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tenant scans the QR or taps UPI. 100% of money hits your bank, and the tenant automatically gets their verified rent receipt.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FAQ Section                                                               */}
          {/* ========================================================================= */}
          <div id="faq" className="max-w-3xl mx-auto space-y-8 scroll-mt-24">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Got Questions?
              </span>
              <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Is RentFlow free to use?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">
                  Yes! RentFlow offers a generous free tier for landlords managing their properties. There are no setup fees or hidden surprises.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Are there any payment gateway charges on rent?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">
                  Zero charges! Unlike platforms that charge 1.5% - 2% gateway commissions, RentFlow uses direct Indian UPI (BHIM / GPay / PhonePe / Paytm). The full rent amount goes straight into your bank account.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Can tenants download verified rent receipts?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">
                  Yes, absolutely. Once rent is recorded, verified digital rent receipts are generated automatically. Tenants can view, print, or share them on WhatsApp anytime.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bottom Banner Call to Action                                             */}
          {/* ========================================================================= */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready to modernise your rental properties?
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join property owners across India who manage their flats with RentFlow. Setup takes less than 2 minutes.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 transition"
              >
                Create Free Landlord Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-12 border-t border-white/10 text-center text-xs text-slate-500 space-y-2">
            <p>© {new Date().getFullYear()} RentFlow Platform. Modern Property & Rent Management for India.</p>
            <p className="text-[11px] text-slate-600">Built with 100% Direct Bank UPI, Automated WhatsApp Reminders, and Verified Digital Receipts.</p>
          </footer>
        </main>
      </div>
    </>
  );
}
