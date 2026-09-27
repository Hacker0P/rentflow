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
  ShieldCheck,
  Building2,
  FileText,
  X,
  User,
  CreditCard,
  Download,
  IndianRupee,
  Share2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function TenantReceiptsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHraModal, setShowHraModal] = useState(false);
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

  // Calculate annual/cumulative totals
  const totalPaidRent = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
  const fullyPaidCount = invoices.filter((inv: any) => inv.isFullyPaid).length;
  const pendingCount = invoices.filter((inv: any) => !inv.isFullyPaid).length;

  const filteredInvoices = invoices.filter((inv: any) => {
    if (filter === 'PAID') return inv.isFullyPaid;
    if (filter === 'PENDING') return !inv.isFullyPaid;
    return true;
  });

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Indian Welcome & HRA Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>{indianGreeting.hindi}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Income Tax Sec 10(13A)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
            <span>Namaste, {tenant?.name || 'Resident'} Ji</span>
            <span className="inline-block text-2xl">🙏</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Download verified rent receipts for your monthly reimbursement or generate a consolidated Annual Statement with your landlord&apos;s PAN for HR tax declaration.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => setShowHraModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-950/30 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Annual HRA Certificate</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Tax Exemption Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Landlord PAN */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Landlord PAN Status
          </span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold font-mono text-slate-800">
              {landlord?.panNumber || 'Not configured'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                landlord?.panNumber
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {landlord?.panNumber ? 'Valid on Receipts' : 'PAN Missing'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Required by Indian Income Tax if annual rent exceeds ₹1,00,000.
          </p>
        </div>

        {/* Total Rent Paid */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Rent Paid (YTD)
          </span>
          <div className="text-2xl font-black text-slate-900 pt-0.5">
            ₹{totalPaidRent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {fullyPaidCount} settled billing month{fullyPaidCount === 1 ? '' : 's'}.
          </p>
        </div>

        {/* Rented Unit Address */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Rented Unit Address
          </span>
          <div className="text-xs font-bold text-slate-800 truncate pt-0.5">
            Unit {unit?.unitNumber}, {property?.name}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-1">
            {property?.address}
          </p>
        </div>
      </div>

      {/* 3. Monthly Receipts List with Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">Monthly Tax Invoices & Receipts</h2>
            <p className="text-xs text-slate-500">Download single-month receipts or print official records</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-semibold self-start sm:self-auto">
            {[
              { id: 'ALL' as const, label: 'All Bills', count: invoices.length },
              { id: 'PAID' as const, label: 'Settled Receipts', count: fullyPaidCount },
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
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filter === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No Rent Invoices Available</h3>
            <p className="text-xs text-slate-400 mt-1">
              Receipts will appear here once your landlord generates monthly bills.
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

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{monthLabel} Rent</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Billed: ₹{inv.totalAmount.toLocaleString('en-IN')} • Paid:{' '}
                      <strong className="text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</strong>
                      {inv.remainingBalance > 0 && (
                        <span className="text-rose-600 font-semibold ml-1">
                          (Due: ₹{inv.remainingBalance.toLocaleString('en-IN')})
                        </span>
                      )}
                    </p>

                    {/* Payment reference if any */}
                    {inv.payments && inv.payments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <span>
                          Settled on:{' '}
                          {new Date(inv.payments[0].paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-600 font-semibold">
                          {inv.payments[0].paymentMethod} ({inv.payments[0].transactionReference || 'UTR Verified'})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                    <button
                      onClick={() => setSelectedReceipt(inv)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>

                    <Link
                      href={`/pay/${inv.id}`}
                      target="_blank"
                      className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Open online invoice link"
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

      {/* INDIVIDUAL MONTHLY RENT RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header Actions */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Official Monthly Rent Receipt</span>
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
                  className="p-1 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Certificate */}
            <div className="p-8 sm:p-10 space-y-6 text-slate-900 font-sans" id="single-receipt-area">
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                  Income Tax Act, 1961 • Section 10(13A)
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                  House Rent Receipt
                </h2>
                <p className="text-xs text-slate-500">
                  Receipt No: RF-{selectedReceipt.id.slice(0, 8).toUpperCase()} • Date: {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>

              {/* Receipt Body Paragraph */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm leading-relaxed text-slate-800 space-y-3">
                <p>
                  Received with thanks from <strong className="text-slate-950 underline underline-offset-2">{tenant?.name}</strong> a sum of{' '}
                  <strong className="text-slate-950 font-black">
                    ₹{selectedReceipt.paidAmount.toLocaleString('en-IN')}
                  </strong>{' '}
                  towards residential house rent for the month of{' '}
                  <strong>
                    {new Date(selectedReceipt.billingMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </strong>.
                </p>
                <p className="text-xs text-slate-600">
                  <strong>Rented Premises:</strong> Unit {unit?.unitNumber}, {property?.name}, {property?.address}
                </p>
                {selectedReceipt.payments && selectedReceipt.payments.length > 0 && (
                  <p className="text-xs text-slate-600">
                    <strong>Payment Mode:</strong> {selectedReceipt.payments[0].paymentMethod} (UTR: {selectedReceipt.payments[0].transactionReference || 'Verified'})
                  </p>
                )}
              </div>

              {/* Landlord Details & PAN */}
              <div className="grid grid-cols-2 gap-4 text-xs p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Landlord / Owner</span>
                  <span className="font-bold text-slate-900 text-sm block">{landlord?.name}</span>
                  <span className="text-slate-500 text-[11px] block">{landlord?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Landlord PAN</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm block">
                    {landlord?.panNumber || 'NOT CONFIGURED'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">PAN mandatory if annual rent &gt; ₹1 Lakh</span>
                </div>
              </div>

              {/* Signatures & Stamp */}
              <div className="pt-6 grid grid-cols-2 gap-8 items-end text-center text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[10px] text-slate-400 mb-2">
                    <span>Affix ₹1</span>
                    <span>Revenue</span>
                    <span>Stamp</span>
                  </div>
                  <span className="text-[10px] text-slate-400">If cash payment &gt; ₹5,000</span>
                </div>

                <div className="border-t border-slate-900 pt-2">
                  <span className="font-bold block text-slate-900">{landlord?.name}</span>
                  <span className="text-[10px] text-slate-500">Signature of Landlord / House Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANNUAL HRA DECLARATION MODAL & PRINT CERTIFICATE */}
      {showHraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold">Annual HRA Rent Certificate (Income Tax Ready)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintCertificate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowHraModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal Certificate Document Body (Print optimized) */}
            <div className="p-8 sm:p-10 space-y-6 text-slate-900 font-sans" id="hra-print-area">
              {/* Certificate Header */}
              <div className="border-b-2 border-slate-900 pb-6 text-center space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 block">
                  Income Tax Act, 1961 • Section 10(13A) & Rule 2A
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Consolidated Rent Receipt & HRA Declaration
                </h2>
                <p className="text-xs text-slate-500">
                  Financial Year: 2026 – 2027 • Assessment Year: 2027 – 2028
                </p>
              </div>

              {/* Landlord & Tenant Metadata */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Tenant (Employee) Details:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{tenant?.name}</p>
                  <p className="text-slate-600">Contact: {tenant?.phone || '—'}</p>
                  <p className="text-slate-600">
                    Rented Premises: Unit {unit?.unitNumber}, {property?.name}, {property?.address}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Landlord (Property Owner) Details:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{landlord?.name}</p>
                  <p className="text-slate-600">Contact: {landlord?.phone || '—'}</p>
                  <p className="text-slate-900 font-bold font-mono">
                    Landlord PAN: <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{landlord?.panNumber || 'NOT CONFIGURED'}</span>
                  </p>
                </div>
              </div>

              {/* Rent Breakdown Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Month-Wise Rental Payment Schedule:
                </span>
                <div className="rounded-xl border border-slate-300 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Billing Month</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Amount Paid</th>
                        <th className="py-2.5 px-3">Payment Mode</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoices.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {new Date(inv.billingMonth).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                              timeZone: 'UTC',
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            ₹{inv.paidAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {inv.payments && inv.payments.length > 0 ? inv.payments[0].paymentMethod : 'DIRECT'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[11px] text-emerald-700">
                            {inv.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                      <tr>
                        <td colSpan={2} className="py-3 px-3 uppercase text-xs tracking-wider">
                          Total Rent Disbursed:
                        </td>
                        <td colSpan={3} className="py-3 px-3 text-emerald-800 text-sm font-black">
                          ₹{totalPaidRent.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Statutory Declaration */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-2">
                <p>
                  <strong>Statutory Declaration:</strong> I, <strong>{landlord?.name}</strong>, certify that I have received the total rent amount of <strong>₹{totalPaidRent.toLocaleString('en-IN')}</strong> from <strong>{tenant?.name}</strong> for the residential premises detailed above.
                </p>
                <p>
                  This certificate is issued for the purpose of claiming House Rent Allowance (HRA) exemption under Section 10(13A) of the Income Tax Act, 1961.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block text-slate-900">{tenant?.name}</span>
                  <span className="text-[10px] text-slate-500">Signature of Tenant (Employee)</span>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold block text-slate-900">{landlord?.name}</span>
                  <span className="text-[10px] text-slate-500">Signature of Landlord / Owner</span>
                </div>
              </div>

              <div className="pt-4 text-center text-[10px] text-slate-400">
                Generated securely via RentFlow SaaS Platform • Timestamp: {new Date().toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
