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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Loading RentFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* Navigation Header                                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-950/60 border border-blue-400/20 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white leading-none">
                RentFlow
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                India
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#showcase" className="hover:text-white transition">
              Interactive Tour
            </a>
            <a href="#how-it-works" className="hover:text-white transition">
              How It Works
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
          </nav>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 sm:px-4.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* Hero Section                                                              */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-24 space-y-24 sm:space-y-32">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Smart Real-Estate Management for India</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop Chasing Rent.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
              Collect Directly on UPI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Say goodbye to endless WhatsApp follow-ups, manual Excel entries, and missing bank receipts. RentFlow powers zero-commission UPI collections, 1-tap WhatsApp reminder slips, verified digital receipts, and live repair tickets.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 group"
            >
              <span>Create Free Landlord Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-sm border border-slate-700/80 transition flex items-center justify-center gap-2 shadow-lg"
            >
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Sign In to Portal</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>0% Gateway Fees (100% direct to your bank)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1-Tap WhatsApp Slips</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official Rent Receipts</span>
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* Interactive Live Showcase Tour                                            */}
        {/* ========================================================================= */}
        <section id="showcase" className="scroll-mt-24">
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl p-5 sm:p-8 backdrop-blur-xl relative overflow-hidden">
            {/* Ambient accent inside card */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Showcase Header with Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Product Preview
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Interactive Walkthrough
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Experience RentFlow from Both Sides
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="p-1 bg-slate-950 rounded-xl flex items-center border border-slate-800 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('LANDLORD')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activePreviewTab === 'LANDLORD'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Landlord Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('TENANT')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activePreviewTab === 'TENANT'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
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
                  {/* KPI Metrics Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Rent
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-white mt-1">₹42,000</div>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Across 2 Units
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Collected Meter
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">₹24,000</div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '57%' }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Occupancy
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-white mt-1">100%</div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">
                        2 of 2 Units Occupied
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Pending Balance
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">₹18,000</div>
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> 1 Due Invoice
                      </span>
                    </div>
                  </div>

                  {/* Active Property Collection Feed */}
                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                    <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Active Property Collections
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Sunshine Heights</span>
                    </div>

                    <div className="divide-y divide-slate-800/80 text-xs">
                      {/* Due Row */}
                      <div className="p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center font-bold">
                            302
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Flat 302, Sunshine Heights</div>
                            <div className="text-[11px] text-slate-400">Tenant: Amit Kumar • ₹18,000/mo</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            Payment Due
                          </span>
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5 border border-emerald-500/20">
                            <MessageCircle className="w-3.5 h-3.5" /> 1-Tap WhatsApp
                          </span>
                        </div>
                      </div>

                      {/* Paid Row */}
                      <div className="p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold">
                            101
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">Flat 101, Sunshine Heights</div>
                            <div className="text-[11px] text-slate-400">Tenant: Priya Singh • ₹24,000/mo</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            Paid via UPI
                          </span>
                          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 border border-slate-700">
                            <Download className="w-3.5 h-3.5 text-blue-400" /> Receipt Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">
                      Ready to automate your properties?
                    </span>
                    <Link
                      href="/login"
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                    >
                      Sign In to Landlord Dashboard <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-4">
                  {/* Tenant Mobile Preview Card */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
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
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Total Amount Due</span>
                        <span className="text-2xl sm:text-3xl font-black text-white">₹18,000</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <QrCode className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5">
                      <div className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2">
                        <QrCode className="w-4 h-4" />
                        <span>Pay via UPI (GPay / PhonePe / Paytm)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold flex items-center justify-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-blue-400" />
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
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 hover:underline"
                    >
                      Sign In to Tenant Portal <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* Feature Grid: 4 Core Pillars                                              */}
        {/* ========================================================================= */}
        <section id="features" className="space-y-10 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Engineered for Simplicity
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need. Nothing You Don&apos;t.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Purpose-built tools to manage rental properties, reconcile settlements, and preserve tenant goodwill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3.5 hover:border-blue-500/40 transition">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">0% Fee Direct UPI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic QR codes prefilled with exact balance. Rent deposits directly into your bank without payment gateway fees.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3.5 hover:border-blue-500/40 transition">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1-Click WhatsApp Invoices</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send polite, pre-formatted rent reminder slips on WhatsApp with 1 tap. Contains unit breakdown, due date, and payment link.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3.5 hover:border-blue-500/40 transition">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Verified Rent Receipts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                HRA-compliant digital receipts created automatically upon settlement. Tenants can print or download PDFs anytime for tax proof.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3.5 hover:border-blue-500/40 transition">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Live Repair Ticket Desk</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No more forgotten maintenance requests lost in chat threads. Track repair status, urgency tags, and landlord resolutions.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* How It Works (3 Steps)                                                    */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="space-y-10 scroll-mt-24">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Effortless Setup
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">How It Works in 3 Steps</h2>
            <p className="text-xs text-slate-400">Up and running in less than 2 minutes. No technical know-how needed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-white">Add Properties &amp; Tenants</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your buildings and units. Link tenants with their phone number, monthly rent amount, and due date.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-white">Dispatch 1-Tap Reminders</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate monthly rent invoices with 1 click. Tap &apos;Send WhatsApp&apos; to send polite billing reminders with payment links.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-white">Direct Settlement &amp; Receipts</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tenants pay directly via UPI. The full balance reaches your account, and an official digital receipt is recorded immediately.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAQ Section                                                               */}
        {/* ========================================================================= */}
        <section id="faq" className="max-w-3xl mx-auto space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3.5">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                Is RentFlow free to use?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Yes! RentFlow offers a generous free tier for landlords managing their properties. There are no setup fees, monthly lock-ins, or hidden charges.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                Are there payment gateway deductions on rent?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Zero charges! Unlike platforms that charge 1.5% - 2% gateway commissions, RentFlow uses direct Indian UPI (BHIM, Google Pay, PhonePe, Paytm). 100% of the rent goes straight into your bank account.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                Can tenants download official rent receipts for tax exemption?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Yes. Once payment is recorded, verified digital rent receipts are generated automatically with landlord PAN support, property address, and payment timestamp for HRA claims.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* Bottom Banner Call to Action                                             */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/25 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to modernize your rental properties?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join property owners across India who collect rent on time without the hassle. Setup takes less than 2 minutes.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition"
            >
              Create Free Landlord Account
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} RentFlow Platform. Modern Property &amp; Rent Operations for India.</p>
          <p className="text-[11px] text-slate-600">Built with 100% Direct Bank UPI, Automated WhatsApp Reminders, and Verified Digital Receipts.</p>
        </footer>
      </main>
    </div>
  );
}
