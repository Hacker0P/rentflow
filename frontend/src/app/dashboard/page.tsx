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
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [whatsAppModalData, setWhatsAppModalData] = useState<WhatsAppReminderData | null>(null);

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Rent & Maintenance Overview</h2>
          <p className="text-slate-400 text-xs mt-1">Real-time status of properties, rental collections, and pending balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateInvoices}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
          >
            {generating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            <span>Generate Monthly Invoices</span>
          </button>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <span>View Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {generateMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{generateMsg}</span>
          <button onClick={() => setGenerateMsg(null)} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}

      {/* Financial KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Financial Performance
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">September 2026 Billing Cycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Expected Collection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expected Rent
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{financials.expectedCollection.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Total active lease receivables
            </div>
          </div>

          {/* Collected Amount with Progress Bar */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition space-y-3 bg-gradient-to-b from-white to-emerald-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Collected
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-700 tracking-tight">
              ₹{financials.collectedAmount.toLocaleString('en-IN')}
            </div>
            <div className="space-y-1">
              <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      financials.expectedCollection > 0
                        ? Math.min(100, Math.round((financials.collectedAmount / financials.expectedCollection) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold pt-0.5">
                <span>Collection Progress</span>
                <span>
                  {financials.expectedCollection > 0
                    ? Math.round((financials.collectedAmount / financials.expectedCollection) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs hover:border-amber-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pending Due
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-700 tracking-tight">
              ₹{financials.pendingAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-amber-700/80 font-medium">
              Due within deadline window
            </div>
          </div>

          {/* Overdue Amount */}
          <div className="bg-white p-6 rounded-3xl border border-rose-200/80 shadow-xs hover:border-rose-300 transition space-y-3 bg-gradient-to-b from-white to-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Overdue
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-700 tracking-tight">
              ₹{financials.overdueAmount.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Requires tenant WhatsApp nudge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio & Occupancy KPIs */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Portfolio & Occupancy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Properties</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalProperties}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Rental Units</span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalUnits}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Occupied Units</span>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">{stats.occupiedUnits}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:border-slate-300 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Occupancy Rate</span>
              <div className="text-2xl font-black text-teal-700 tracking-tight">{stats.occupancyRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Feeds: Upcoming Due and Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Due Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Due Invoices</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bills requiring collection</p>
            </div>
            <Link
              href="/dashboard/invoices"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </Link>
          </div>

          {upcomingInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No upcoming invoices due in the next 14 days.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingInvoices.map((inv) => {
                const cleanPhone = inv.tenantPhone ? inv.tenantPhone.replace(/[^0-9]/g, '') : '';
                const payLink = typeof window !== 'undefined' ? `${window.location.origin}/pay/${inv.id}` : `/pay/${inv.id}`;
                const waMessage = `Hello ${inv.tenantName}, this is a gentle reminder that your rent for Unit ${inv.unitNumber} (${inv.propertyName}) of ₹${inv.remainingBalance.toLocaleString('en-IN')} is due on ${new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. You can view your invoice & pay via UPI here: ${payLink}`;
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">
                        {inv.tenantName} ({inv.unitNumber} - {inv.propertyName})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-900 block">
                          ₹{inv.remainingBalance.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                            inv.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
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
                          title="Send WhatsApp Reminder (3 Templates)"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/pay/${inv.id}`}
                          target="_blank"
                          title="View & Print Invoice"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Payments Received</h3>
              <p className="text-xs text-slate-500 mt-0.5">Verified landlord receipts</p>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View Ledger
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No payment transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      {p.tenantName} ({p.unitNumber})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} via {p.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-emerald-700 block">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </span>
                    {p.transactionReference && (
                      <span className="text-[10px] text-slate-400 font-mono">
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

