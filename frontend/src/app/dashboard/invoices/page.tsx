'use client';

import { useEffect, useState } from 'react';
import {
  ReceiptText,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  AlertCircle,
  Calendar,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { WhatsAppModal, WhatsAppReminderData } from '@/components/whatsapp-modal';

interface Invoice {

  id: string;
  billingMonth: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  financialSummary: {
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    isFullyPaid: boolean;
  };
  lease: {
    tenant: {
      name: string;
      phone: string;
    };
    unit: {
      unitNumber: string;
      property: {
        name: string;
      };
    };
  };
  items: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  // Payment Recording Modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('UPI');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [submittingPay, setSubmittingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [whatsAppModalData, setWhatsAppModalData] = useState<WhatsAppReminderData | null>(null);

  const handleCopyLink = (id: string) => {

    const url = typeof window !== 'undefined' ? `${window.location.origin}/pay/${id}` : `/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Invoice[]>('/invoices');
      setInvoices(res.data);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (inv: Invoice) => {
    setPayingInvoice(inv);
    setPayAmount(inv.financialSummary.remainingBalance);
    setPayRef('');
    setPayNotes('');
    setPayError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setSubmittingPay(true);
    setPayError(null);

    try {
      await apiRequest(`/invoices/${payingInvoice.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod: payMethod,
          transactionReference: payRef || undefined,
          notes: payNotes || undefined,
        }),
      });

      setPayingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      setPayError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPay(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'ALL') return true;
    return inv.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Paid</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">Partially Paid</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">Overdue</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Invoices & Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track rent invoices, due dates, outstanding balances, and manual payments.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          {['ALL', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE', 'PAID'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                filter === tab ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No invoices found</h3>
          <p className="text-xs text-slate-400 mt-1">Use the dashboard to generate monthly bills for your active leases.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* 1. Mobile App Card View (< lg screens) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      {inv.lease.tenant.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Unit {inv.lease.unit.unitNumber} • {inv.lease.unit.property.name}
                    </span>
                  </div>
                  <div>{getStatusBadge(inv.status)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Period</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {new Date(inv.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Due Date</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Balance</span>
                    <span className={`text-xs font-bold ${inv.financialSummary.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      ₹{inv.financialSummary.remainingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    {!inv.financialSummary.isFullyPaid && (
                      <button
                        onClick={() =>
                          setWhatsAppModalData({
                            invoiceId: inv.id,
                            tenantName: inv.lease.tenant.name,
                            tenantPhone: inv.lease.tenant.phone,
                            unitNumber: inv.lease.unit.unitNumber,
                            propertyName: inv.lease.unit.property.name,
                            amount: inv.financialSummary.remainingBalance,
                            dueDate: inv.dueDate,
                          })
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    <a
                      href={`/pay/${inv.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                      title="View Bill"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {!inv.financialSummary.isFullyPaid && (
                    <button
                      onClick={() => openPaymentModal(inv)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Pay</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 2. Desktop Table View (>= lg screens) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Tenant / Property</th>
                  <th className="py-3.5 px-4">Billing Month</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid / Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 block text-xs">{inv.lease.tenant.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {inv.lease.unit.unitNumber} • {inv.lease.unit.property.name}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      {new Date(inv.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ₹{inv.financialSummary.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-emerald-700 font-semibold block">
                        ₹{inv.financialSummary.paidAmount.toLocaleString('en-IN')} paid
                      </span>
                      {inv.financialSummary.remainingBalance > 0 && (
                        <span className="text-rose-600 font-medium text-[11px]">
                          ₹{inv.financialSummary.remainingBalance.toLocaleString('en-IN')} due
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Reminder (if unpaid) */}
                        {!inv.financialSummary.isFullyPaid && (
                          <button
                            onClick={() =>
                              setWhatsAppModalData({
                                invoiceId: inv.id,
                                tenantName: inv.lease.tenant.name,
                                tenantPhone: inv.lease.tenant.phone,
                                unitNumber: inv.lease.unit.unitNumber,
                                propertyName: inv.lease.unit.property.name,
                                amount: inv.financialSummary.remainingBalance,
                                dueDate: inv.dueDate,
                              })
                            }
                            title="Send WhatsApp Reminder (3 Templates)"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Copy Shareable Pay Link */}
                        <button
                          onClick={() => handleCopyLink(inv.id)}
                          title="Copy Public Pay Link"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          {copiedId === inv.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>

                        {/* View / Print Receipt */}
                        <a
                          href={`/pay/${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View & Print Official Receipt"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Record Payment */}
                        {!inv.financialSummary.isFullyPaid && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition ml-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Record Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">Record Tenant Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recording payment for {payingInvoice.lease.tenant.name} ({payingInvoice.lease.unit.unitNumber}). Outstanding: ₹{payingInvoice.financialSummary.remainingBalance.toLocaleString('en-IN')}
            </p>

            {payError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={payingInvoice.financialSummary.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none bg-white font-medium"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI/20260905/123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Partial payment for September rent"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay || payAmount <= 0}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
                >
                  {submittingPay ? 'Recording...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Set WhatsApp Reminder Templates Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        data={whatsAppModalData}
      />
    </div>
  );
}


