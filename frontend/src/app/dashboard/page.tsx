'use client';

import { useEffect, useState } from 'react';
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
  ExternalLink,
  Sparkles,
  Users,
  Plus,
  ArrowRight,
  CreditCard,
  Send,
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading landlord analytics...</p>
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      {/* 1. Top Header & Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Command Center
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
            Rent & Collections
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Welcome back, {user?.name || 'Landlord'}. Real-time billing and payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateInvoices}
            disabled={generating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950 transition disabled:opacity-50"
          >
            {generating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            <span>Generate Invoices</span>
          </button>

          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            <span>Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {generateMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{generateMsg}</span>
          <button onClick={() => setGenerateMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-black">
            ×
          </button>
        </div>
      )}

      {/* 3. Financial Performance: 2x2 Grid on Mobile, 4-col on Desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Financial KPIs
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">Current Billing Cycle</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Expected Rent */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Expected
              </span>
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ₹{financials.expectedCollection.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Total active leases
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
                Pending
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
                Overdue
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
              ₹{financials.overdueAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-rose-600 font-medium">
              Requires nudge
            </div>
          </div>
        </div>
      </div>

      {/* 4. Portfolio & Occupancy: 4 Compact Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Portfolio & Units
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <span className="text-[11px] text-slate-500 font-medium block">Rental Units</span>
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
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Occupancy</span>
              <div className="text-xl font-black text-teal-700">{stats.occupancyRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Feeds: Upcoming Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Invoices Feed */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Due Bills</h3>
              <p className="text-xs text-slate-500 mt-0.5">Invoices requiring collection</p>
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
              No pending invoices due in the next 14 days.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-xs block truncate">
                      {inv.tenantName} ({inv.unitNumber})
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
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
                          inv.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments Feed */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Payments Received</h3>
              <p className="text-xs text-slate-500 mt-0.5">Verified landlord receipts</p>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No payment transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 text-xs block truncate">
                      {p.tenantName} ({p.unitNumber})
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} via {p.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-emerald-700 block">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </span>
                    {p.transactionReference && (
                      <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[120px]">
                        {p.transactionReference}
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
