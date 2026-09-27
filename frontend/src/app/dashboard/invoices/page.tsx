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
  Search,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { WhatsAppModal, WhatsAppReminderData } from '@/components/whatsapp-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

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
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

      const invToAcknowledge = payingInvoice;
      const recordedAmount = Number(payAmount);
      const recordedMethod = payMethod;
      const recordedRef = payRef;

      setPayingInvoice(null);
      await fetchInvoices();

      if (invToAcknowledge && invToAcknowledge.lease?.tenant?.phone) {
        setWhatsAppModalData({
          invoiceId: invToAcknowledge.id,
          tenantName: invToAcknowledge.lease.tenant.name,
          tenantPhone: invToAcknowledge.lease.tenant.phone,
          unitNumber: invToAcknowledge.lease.unit.unitNumber,
          propertyName: invToAcknowledge.lease.unit.property.name,
          amount: invToAcknowledge.totalAmount,
          paidAmount: recordedAmount,
          dueDate: invToAcknowledge.dueDate,
          billingMonth: invToAcknowledge.billingMonth,
          isPaid: true,
          paymentMethod: recordedMethod,
          transactionReference: recordedRef || undefined,
        });
      }
    } catch (err: any) {
      setPayError(err.message || 'Failed to record payment');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Status counts for quick glance tabs
  const allCount = invoices.length;
  const pendingCount = invoices.filter(
    (inv) => inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID'
  ).length;
  const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;
  const paidCount = invoices.filter((inv) => inv.status === 'PAID').length;

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce(
    (sum, inv) => sum + Number(inv.financialSummary?.paidAmount || 0),
    0
  );
  const totalRemaining = invoices.reduce(
    (sum, inv) => sum + Number(inv.financialSummary?.remainingBalance || 0),
    0
  );

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = inv.lease?.tenant?.name?.toLowerCase().includes(q);
      const matchUnit = inv.lease?.unit?.unitNumber?.toLowerCase().includes(q);
      const matchProperty = inv.lease?.unit?.property?.name?.toLowerCase().includes(q);
      if (!matchName && !matchUnit && !matchProperty) {
        return false;
      }
    }

    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID';
    if (filter === 'OVERDUE') return inv.status === 'OVERDUE';
    if (filter === 'PAID') return inv.status === 'PAID';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="sm" dot>Paid</Badge>;
      case 'OVERDUE':
        return <Badge variant="error" size="sm" dot>Overdue</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="info" size="sm" dot>Partial</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning" size="sm" dot>Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Invoices & Billing</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track rent requests, collect payments via UPI, and issue verified rent receipts.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Invoiced</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                ₹{totalBilled.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-700 font-medium block">Total Collected</span>
              <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-800 font-medium block">Outstanding Balance</span>
              <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">
                ₹{totalRemaining.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All', count: allCount },
            { key: 'PENDING', label: 'Pending', count: pendingCount },
            { key: 'OVERDUE', label: 'Overdue', count: overdueCount },
            { key: 'PAID', label: 'Paid', count: paidCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                filter === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === tab.key ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenant, unit, building..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading invoices...</p>
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No invoices found"
          description={
            searchQuery
              ? `No invoices match your search term "${searchQuery}".`
              : 'No invoices match this status filter.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const isFullyPaid = inv.financialSummary?.isFullyPaid || inv.status === 'PAID';

            return (
              <Card key={inv.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {inv.lease?.tenant?.name || 'Tenant'}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Unit {inv.lease?.unit?.unitNumber} • {inv.billingMonth}
                      </span>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Due Date</span>
                      <span className="text-slate-700 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </span>
                      {!isFullyPaid && inv.financialSummary?.remainingBalance > 0 && (
                        <span className="text-[10px] text-amber-700 block font-mono">
                          Bal: ₹{Number(inv.financialSummary.remainingBalance).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(inv.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 font-medium"
                      >
                        {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === inv.id ? 'Copied' : 'Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setWhatsAppModalData({
                            invoiceId: inv.id,
                            tenantName: inv.lease?.tenant?.name || 'Tenant',
                            tenantPhone: inv.lease?.tenant?.phone || '',
                            unitNumber: inv.lease?.unit?.unitNumber || '',
                            propertyName: inv.lease?.unit?.property?.name || '',
                            amount: inv.totalAmount,
                            dueDate: inv.dueDate,
                            isPaid: isFullyPaid,
                            paidAmount: inv.financialSummary?.paidAmount,
                            billingMonth: inv.billingMonth,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {!isFullyPaid && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPaymentModal(inv)}
                      >
                        Record Pay
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Record Manual Payment */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title="Record Payment"
        description={
          payingInvoice
            ? `Record offline UPI, bank transfer, or cash received for ${payingInvoice.lease?.tenant?.name}.`
            : ''
        }
      >
        {payingInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {payError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Remaining Due</span>
                <span className="font-bold text-slate-900 text-base font-mono tabular-nums">
                  ₹{Number(payingInvoice.financialSummary.remainingBalance).toLocaleString('en-IN')}
                </span>
              </div>
              <Badge variant="warning" size="sm" dot>
                {payingInvoice.status}
              </Badge>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={payingInvoice.financialSummary.remainingBalance}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Channel *
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="BANK_TRANSFER">Direct IMPS / NEFT Transfer</option>
                <option value="CASH">Cash in Hand</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                UPI / Bank Reference Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / UTR 4281987321"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Internal Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in full for September rent"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setPayingInvoice(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={submittingPay}
              >
                Confirm Payment & Send Receipt
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        data={whatsAppModalData}
      />
    </div>
  );
}
