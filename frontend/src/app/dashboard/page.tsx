'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Receipt,
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  MessageCircle,
  Users,
  Plus,
  ArrowRight,
  Phone,
  RefreshCw,
  X,
  CreditCard,
  Send,
  Sparkles,
} from 'lucide-react';
import { apiRequest, getStoredUser } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WhatsAppModal, WhatsAppReminderData } from '@/components/whatsapp-modal';

interface DashboardData {
  stats: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
  };
  financials: {
    expectedCollection: number;
    collectedAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference?: string;
    tenantName: string;
    unitNumber: string;
    propertyName: string;
  }>;
  upcomingInvoices: Array<{
    id: string;
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    dueDate: string;
    status: string;
    tenantName: string;
    tenantPhone: string;
    unitNumber: string;
    propertyName: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [whatsAppModalData, setWhatsAppModalData] = useState<WhatsAppReminderData | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DashboardData>('/dashboard/summary');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    fetchDashboardData();
  }, []);

  const handleGenerateInvoices = async () => {
    try {
      setGenerating(true);
      setGenerateMsg(null);
      const res = await apiRequest<any>('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setGenerateMsg(`Generated ${res.data.generatedCount} invoice(s), ${res.data.skippedCount} already billed.`);
      await fetchDashboardData();
    } catch (err: any) {
      setGenerateMsg(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const indianGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return { hindi: 'Shubh Prabhat', english: 'Good Morning' };
    if (hour >= 12 && hour < 17) return { hindi: 'Shubh Dopahar', english: 'Good Afternoon' };
    return { hindi: 'Shubh Sandhya', english: 'Good Evening' };
  }, []);

  const currentDateString = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, []);

  const currentMonthYear = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'This Month';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading your rental overview...</p>
        </div>
      </div>
    );
  }

  const { stats, financials, recentPayments, upcomingInvoices } = data || {
    stats: { totalProperties: 0, totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, occupancyRate: 0 },
    financials: { expectedCollection: 0, collectedAmount: 0, pendingAmount: 0, overdueAmount: 0 },
    recentPayments: [],
    upcomingInvoices: [],
  };

  const collectionPct =
    financials.expectedCollection > 0
      ? Math.min(100, Math.round((financials.collectedAmount / financials.expectedCollection) * 100))
      : 0;

  const overdueInvoices = upcomingInvoices.filter((inv) => inv.status === 'OVERDUE');
  const pendingInvoices = upcomingInvoices.filter((inv) => inv.status !== 'OVERDUE');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      {/* 1. Indian Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-md border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          {/* Top greeting badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>{indianGreeting.hindi}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live RentFlow</span>
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {currentDateString}
            </span>
          </div>

          {/* Welcoming Name */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
            <span>Namaste, {user?.name || 'Landlord'} Ji</span>
            <span className="inline-block text-2xl">🙏</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Welcome to your property portfolio. Here is your rent collection, occupancy health, and tenant dues for{' '}
            <strong className="text-emerald-400 font-semibold">{currentMonthYear}</strong>.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={handleGenerateInvoices}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            {generating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            <span>Generate Monthly Bills</span>
          </button>

          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600/80 transition"
          >
            <span>All Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {generateMsg && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{generateMsg}</span>
          </div>
          <button onClick={() => setGenerateMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-black p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Quick Action Shortcuts for Indian Landlords */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          href="/dashboard/properties"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Add Unit / Flat</span>
            <span className="text-[10px] text-slate-400 block truncate">Manage properties</span>
          </div>
        </Link>

        <Link
          href="/dashboard/tenants"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Add Tenant</span>
            <span className="text-[10px] text-slate-400 block truncate">Create rental lease</span>
          </div>
        </Link>

        <Link
          href="/dashboard/payments"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Record Payment</span>
            <span className="text-[10px] text-slate-400 block truncate">Cash or UPI entry</span>
          </div>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">WhatsApp Nudge</span>
            <span className="text-[10px] text-slate-400 block truncate">Remind pending rent</span>
          </div>
        </Link>
      </div>

      {/* 3. Smart Rent Health Alert Banner */}
      {financials.overdueAmount > 0 ? (
        <div className="p-4 rounded-3xl bg-rose-50/90 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-950">
                Action Required: ₹{financials.overdueAmount.toLocaleString('en-IN')} in Overdue Rent
              </h4>
              <p className="text-xs text-rose-800/80 mt-0.5">
                You have {overdueInvoices.length} overdue invoice(s) needing attention. Send a polite WhatsApp reminder directly from the list below.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/invoices"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition shrink-0"
          >
            Review Overdue Bills
          </Link>
        </div>
      ) : collectionPct === 100 && financials.expectedCollection > 0 ? (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-950">
              Badhai Ho! 🎉 100% Rent Collected for {currentMonthYear}
            </h4>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              All expected rent of ₹{financials.expectedCollection.toLocaleString('en-IN')} has been successfully settled.
            </p>
          </div>
        </div>
      ) : null}

      {/* 4. Financial Performance (Rent Collections in ₹) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>Rent Collections</span>
            <span>•</span>
            <span className="text-emerald-700 font-extrabold">{currentMonthYear}</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">Indian Rupee (₹)</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Expected Rent */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Expected Rent
              </span>
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ₹{financials.expectedCollection.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Total monthly active leases
            </div>
          </div>

          {/* Collected Amount */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs space-y-2 bg-gradient-to-b from-white to-emerald-50/20 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Collected
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              ₹{financials.collectedAmount.toLocaleString('en-IN')}
            </div>
            <div className="space-y-1">
              <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${collectionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold">
                <span>Progress</span>
                <span>{collectionPct}%</span>
              </div>
            </div>
          </div>

          {/* Pending Due */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-2 hover:border-amber-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Pending Due
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">
              ₹{financials.pendingAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-700/80 font-medium">
              Within payment window
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-200/80 shadow-xs space-y-2 bg-gradient-to-b from-white to-rose-50/20 hover:border-rose-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Overdue Rent
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
              ₹{financials.overdueAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-rose-600 font-medium">
              Requires immediate nudge
            </div>
          </div>
        </div>
      </div>

      {/* 5. Portfolio & Units Snapshot */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Property & Unit Occupancy
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Properties</span>
              <div className="text-xl font-black text-slate-900">{stats.totalProperties}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Total Units</span>
              <div className="text-xl font-black text-slate-900">{stats.totalUnits}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Occupied</span>
              <div className="text-xl font-black text-emerald-700">{stats.occupiedUnits}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Vacant</span>
              <div className="text-xl font-black text-amber-700">{stats.vacantUnits}</div>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Occupancy Rate</span>
              <div className="text-xl font-black text-teal-700">{stats.occupancyRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Feeds: Upcoming Invoices & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Invoices Feed */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tenant Rent Invoices Due</h3>
              <p className="text-xs text-slate-500 mt-0.5">Send polite 1-tap WhatsApp reminders</p>
            </div>
            <Link
              href="/dashboard/invoices"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No pending invoices due in the next 14 days. All tenants are up to date!
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingInvoices.map((inv) => {
                const isOverdue = inv.status === 'OVERDUE';

                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isOverdue
                        ? 'border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70'
                        : 'border-slate-100 bg-slate-50/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs block truncate">
                          {inv.tenantName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          (Unit {inv.unitNumber})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {inv.propertyName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-black text-xs text-slate-900 block">
                          ₹{inv.remainingBalance.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      {/* WhatsApp Reminder Button */}
                      <button
                        onClick={() =>
                          setWhatsAppModalData({
                            invoiceId: inv.id,
                            tenantName: inv.tenantName,
                            tenantPhone: inv.tenantPhone,
                            unitNumber: inv.unitNumber,
                            propertyName: inv.propertyName,
                            amount: inv.remainingBalance,
                            dueDate: inv.dueDate,
                          })
                        }
                        title="Send WhatsApp Reminder"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>

                      {/* Quick Call */}
                      {inv.tenantPhone && (
                        <a
                          href={`tel:${inv.tenantPhone}`}
                          title="Call Tenant"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Verified Collections (Ledger Preview) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Verified Collections</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time payment receipt log</p>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Payment Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No payment transactions recorded yet. When tenants settle rent via UPI or cash, entries will appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-xs block truncate">
                      {p.tenantName} ({p.unitNumber})
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} via {p.paymentMethod} • {p.propertyName}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-emerald-700 block">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </span>
                    {p.transactionReference ? (
                      <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[120px]" title={p.transactionReference}>
                        Ref: {p.transactionReference}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pre-Set WhatsApp Reminder Templates Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        data={whatsAppModalData}
      />
    </div>
  );
}
