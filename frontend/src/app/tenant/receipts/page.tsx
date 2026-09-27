'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function TenantReceiptsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await apiRequest('/tenant/dashboard');
        setData(res.data);
      } catch (err: any) {
        console.error('Failed to load receipts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const indianGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return { hindi: 'Shubh Prabhat', english: 'Good Morning' };
    if (hour >= 12 && hour < 17) return { hindi: 'Shubh Dopahar', english: 'Good Afternoon' };
    return { hindi: 'Shubh Sandhya', english: 'Good Evening' };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-semibold">Fetching payment records...</span>
        </div>
      </div>
    );
  }

  const invoices = data?.invoices || [];
  const tenant = data?.tenant;
  const landlord = data?.landlord;
  const unit = data?.unit;
  const property = data?.property;
  const lease = data?.lease;

  // Calculate totals
  const totalPaidRent = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
  const fullyPaidCount = invoices.filter((inv: any) => inv.isFullyPaid).length;
  const pendingCount = invoices.filter((inv: any) => !inv.isFullyPaid).length;
  const totalPendingAmount = invoices
    .filter((inv: any) => !inv.isFullyPaid)
    .reduce((acc: number, inv: any) => acc + (inv.remainingBalance || 0), 0);

  const filteredInvoices = invoices.filter((inv: any) => {
    if (filter === 'PAID') return inv.isFullyPaid;
    if (filter === 'PENDING') return !inv.isFullyPaid;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Welcoming Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>{indianGreeting.hindi}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Payment Records</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Namaste, {tenant?.name || 'Resident'} Ji</span>
            <span className="inline-block text-2xl">🙏</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Easily track your monthly rent payments. See which months are paid, check any pending dues, and view or print payment receipts anytime.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Link
            href="/tenant"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold text-xs shadow-md transition"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="absolute right-0 top-0 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Simple Stat Cards (Has the tenant paid or is something pending?) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Payment Status
          </span>
          <div className="flex items-center justify-between pt-1">
            {pendingCount === 0 ? (
              <span className="text-lg font-black text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                All Caught Up
              </span>
            ) : (
              <span className="text-lg font-black text-rose-600 flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-rose-500" />
                {pendingCount} Bill{pendingCount > 1 ? 's' : ''} Pending
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                pendingCount === 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {pendingCount === 0 ? 'Fully Paid' : `₹${totalPendingAmount.toLocaleString('en-IN')} Due`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {pendingCount === 0
              ? 'All generated rent bills have been settled in full.'
              : 'Please pay pending dues to keep your rent record clear.'}
          </p>
        </div>

        {/* Total Rent Paid */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Rent Paid
          </span>
          <div className="text-2xl font-black text-slate-900 pt-0.5">
            ₹{totalPaidRent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {fullyPaidCount} settled monthly bill{fullyPaidCount === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Rented Residence */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Rented Unit & Owner
          </span>
          <div className="text-xs font-bold text-slate-800 truncate pt-0.5">
            Unit {unit?.unitNumber}, {property?.name}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-1">
            Owner: {landlord?.name || 'Landlord'} • ₹{lease?.monthlyRent?.toLocaleString('en-IN') || 0}/mo
          </p>
        </div>
      </div>

      {/* 3. Monthly Bills & Receipts Tracker */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">Monthly Rent History & Receipts</h2>
            <p className="text-xs text-slate-500">Check paid status for each month and view or print receipts</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-semibold self-start sm:self-auto">
            {[
              { id: 'ALL' as const, label: 'All Bills', count: invoices.length },
              { id: 'PAID' as const, label: 'Paid', count: fullyPaidCount },
              { id: 'PENDING' as const, label: 'Pending Dues', count: pendingCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filter === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No Rent Invoices Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'ALL'
                ? 'Your monthly rent bills will appear here once generated.'
                : filter === 'PENDING'
                ? 'No pending bills! You have cleared all payments.'
                : 'No paid receipts available yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((inv: any) => {
              const billingDate = new Date(inv.billingMonth);
              const monthLabel = billingDate.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              });

              const isPaid = inv.isFullyPaid || inv.status === 'PAID';
              const isPartial = inv.status === 'PARTIALLY_PAID';

              return (
                <div
                  key={inv.id}
                  className={`bg-white rounded-3xl border shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    isPaid
                      ? 'border-emerald-200/80 hover:border-emerald-300'
                      : 'border-amber-200/90 bg-amber-50/20 hover:border-amber-300'
                  }`}
                >
                  {/* Left info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">{monthLabel} Rent</h3>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          PAID
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          PARTIALLY PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <Clock className="w-3.5 h-3.5 text-rose-600" />
                          PENDING PAYMENT
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span>
                        Total Bill: <strong>₹{inv.totalAmount.toLocaleString('en-IN')}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Amount Paid:{' '}
                        <strong className={isPaid ? 'text-emerald-700' : 'text-slate-800'}>
                          ₹{inv.paidAmount.toLocaleString('en-IN')}
                        </strong>
                      </span>
                      {!isPaid && inv.remainingBalance > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600 font-bold">
                            Balance Due: ₹{inv.remainingBalance.toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Due Date & Settlement details */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>
                        Due Date:{' '}
                        {new Date(inv.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      {inv.payments && inv.payments.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            Settled on:{' '}
                            {new Date(inv.payments[0].paymentDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">
                            {inv.payments[0].paymentMethod}
                            {inv.payments[0].transactionReference
                              ? ` (${inv.payments[0].transactionReference})`
                              : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                    {isPaid ? (
                      <button
                        onClick={() => setSelectedReceipt(inv)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs active:scale-95"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/pay/${inv.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now (₹{inv.remainingBalance.toLocaleString('en-IN')})</span>
                        </Link>
                        {inv.paidAmount > 0 && (
                          <button
                            onClick={() => setSelectedReceipt(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Partial Slip</span>
                          </button>
                        )}
                      </>
                    )}

                    <Link
                      href={`/pay/${inv.id}`}
                      target="_blank"
                      className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Open online payment link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CLEAN, SIMPLE RENT PAYMENT RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header Actions */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Rent Payment Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Clean Receipt Body */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 font-sans" id="single-receipt-area">
              {/* Receipt Header */}
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                      RF
                    </div>
                    <span className="font-black text-slate-900 tracking-tight text-base">RentFlow</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                    Monthly Rent Payment Receipt
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Receipt #{selectedReceipt.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-600 font-medium block">
                    Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Payment Status</span>
                  <span className="text-base font-black text-emerald-900">
                    {selectedReceipt.isFullyPaid ? 'Paid in Full' : 'Partially Paid'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Amount Settled</span>
                  <span className="text-2xl font-black text-emerald-800">
                    ₹{selectedReceipt.paidAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Summary Details */}
              <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Tenant Name</span>
                  <span className="font-bold text-slate-900 text-sm block">{tenant?.name}</span>
                  <span className="text-slate-500 text-[11px] block">{tenant?.phone || tenant?.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Landlord / Owner</span>
                  <span className="font-bold text-slate-900 text-sm block">{landlord?.name}</span>
                  <span className="text-slate-500 text-[11px] block">{landlord?.phone || landlord?.email}</span>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-1.5 text-xs border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Rented Premises</span>
                <p className="font-semibold text-slate-800">
                  Unit {unit?.unitNumber}, {property?.name}
                </p>
                <p className="text-slate-500 text-[11px]">{property?.address}</p>
              </div>

              {/* Payment Details Table */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Billing Details</span>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  <div className="p-3 flex justify-between bg-slate-50 font-semibold text-slate-700">
                    <span>Rent for Month</span>
                    <span>
                      {new Date(selectedReceipt.billingMonth).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Total Billed Amount</span>
                    <span className="font-semibold text-slate-800">
                      ₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Payment Mode</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReceipt.payments && selectedReceipt.payments.length > 0
                        ? selectedReceipt.payments[0].paymentMethod
                        : 'UPI / Direct'}
                    </span>
                  </div>
                  {selectedReceipt.payments && selectedReceipt.payments[0]?.transactionReference && (
                    <div className="p-3 flex justify-between">
                      <span className="text-slate-600">Transaction Reference / UTR</span>
                      <span className="font-mono text-slate-800 font-semibold">
                        {selectedReceipt.payments[0].transactionReference}
                      </span>
                    </div>
                  )}
                  {selectedReceipt.payments && selectedReceipt.payments[0]?.paymentDate && (
                    <div className="p-3 flex justify-between">
                      <span className="text-slate-600">Settlement Date</span>
                      <span className="text-slate-800">
                        {new Date(selectedReceipt.payments[0].paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 text-center text-[10px] text-slate-400">
                This receipt is computer-generated upon payment verification on RentFlow. No physical signature is required.
              </div>

              {/* Close Button on Mobile / Non-print */}
              <div className="pt-2 print:hidden">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
