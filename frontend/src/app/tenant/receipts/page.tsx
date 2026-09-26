'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function TenantReceiptsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHraModal, setShowHraModal] = useState(false);

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

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title & Info Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tax Deductions & Receipts
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Sec 10(13A)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HRA Rent Receipts & Certificates</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Download verified rent receipts for your monthly reimbursement or generate a consolidated Annual Statement with your landlord&apos;s PAN for HR tax declaration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={() => setShowHraModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Annual HRA Certificate</span>
          </button>
        </div>
      </div>

      {/* Tax Exemption Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Landlord PAN Status
          </span>
          <div className="flex items-center justify-between">
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
            Required by Indian Income Tax if rent exceeds ₹1,00,000/year.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Rent Paid (YTD)
          </span>
          <div className="text-2xl font-black text-slate-900">
            ₹{totalPaidRent.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {fullyPaidCount} settled billing month{fullyPaidCount === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Rented Unit Address
          </span>
          <div className="text-xs font-bold text-slate-800 truncate">
            Unit {unit?.unitNumber}, {property?.name}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-1">
            {property?.address}
          </p>
        </div>
      </div>

      {/* Monthly Receipts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900">Monthly Tax Invoices & Receipts</h2>
          <span className="text-xs text-slate-500 font-medium">{invoices.length} Available</span>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No Rent Invoices Available</h3>
            <p className="text-xs text-slate-400 mt-1">
              Receipts will appear here once your landlord generates monthly bills.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv: any) => {
              const billingDate = new Date(inv.billingMonth);
              const monthLabel = billingDate.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              });

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
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
                    {inv.payments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <span>
                          Settled on:{' '}
                          {new Date(inv.payments[0].paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {inv.payments[0].paymentMethod} ({inv.payments[0].transactionReference || 'UTR Verified'})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                    <Link
                      href={`/pay/${inv.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-300" />
                      <span>Print / PDF Receipt</span>
                    </Link>

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
                            {inv.payments.length > 0 ? inv.payments[0].paymentMethod : 'DIRECT'}
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
