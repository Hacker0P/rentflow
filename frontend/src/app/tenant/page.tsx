'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Building,
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Smartphone,
  Phone,
  MessageCircle,
  Copy,
  Receipt,
  FileCheck2,
  ShieldCheck,
  Calendar,
  IndianRupee,
  ExternalLink,
  CreditCard,
  Send,
  X,
  Wrench,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

interface TenantDashboardData {
  hasActiveLease: boolean;
  tenant: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  };
  unit: {
    unitNumber: string;
    floor?: number;
  };
  property: {
    name: string;
    address: string;
  };
  landlord: {
    name: string;
    email: string;
    phone: string;
    upiId: string;
    qrImageUrl?: string;
    panNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  };
  lease: {
    id: string;
    monthlyRent: number;
    maintenanceAmount: number;
    securityDeposit: number;
    rentDueDay: number;
    startDate: string;
  };
  currentBill: {
    id: string;
    billingMonth: string;
    dueDate: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    isFullyPaid: boolean;
    items: Array<{
      id: string;
      type: string;
      description: string;
      amount: number;
    }>;
  } | null;
  upiUrl: string | null;
  invoices: any[];
}

export default function TenantHomePage() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [payTab, setPayTab] = useState<'UPI' | 'BANK'>('UPI');
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);
  const [copiedBankIfsc, setCopiedBankIfsc] = useState(false);

  // Self-report payment form state
  const [reportAmount, setReportAmount] = useState<number>(0);
  const [reportMethod, setReportMethod] = useState<string>('UPI');
  const [reportRef, setReportRef] = useState<string>('');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<TenantDashboardData>('/tenant/dashboard');
      setData(res.data);
      if (res.data.currentBill) {
        setReportAmount(res.data.currentBill.remainingBalance);
      }
    } catch (err: any) {
      console.error('Failed to load tenant dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
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

  const handleCopyUpi = () => {
    if (data?.landlord?.upiId) {
      navigator.clipboard.writeText(data.landlord.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.currentBill) return;

    setSubmittingReport(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      await apiRequest(`/tenant/invoices/${data.currentBill.id}/report-payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(reportAmount),
          paymentMethod: reportMethod,
          transactionReference: reportRef.trim(),
          notes: reportNotes.trim() || undefined,
        }),
      });

      setReportSuccess('Payment reference submitted! Your landlord will verify it shortly.');
      setReportRef('');
      setReportNotes('');
      await fetchDashboard();
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(null);
      }, 3000);
    } catch (err: any) {
      setReportError(err.message || 'Failed to submit payment reference');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading your rental portal...</p>
        </div>
      </div>
    );
  }

  if (!data?.hasActiveLease) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto shadow-xs">
          <Home className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">No Active Lease Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Your phone number is not linked to an active rental agreement yet. Please ask your landlord to create your lease in RentFlow.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={fetchDashboard}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Check Again
        </Button>
      </div>
    );
  }

  const bill = data.currentBill;
  const isPaid = bill?.isFullyPaid || bill?.status === 'PAID';

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* 1. Header Greeting & Residence Badge */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Welcome, {data.tenant?.name?.split(' ')[0]}
            </h1>
            <Badge variant="brand" size="sm">
              Resident
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit {data.unit?.unitNumber} • {data.property?.name}
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={refreshing}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Refresh Portal Data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Monthly Rent Bill Card */}
      {bill ? (
        <Card className={isPaid ? 'border-emerald-200/80' : 'border-blue-200/80'}>
          <CardHeader>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Rent Bill • {bill.billingMonth}</CardTitle>
                <Badge
                  variant={isPaid ? 'success' : bill.status === 'OVERDUE' ? 'error' : 'warning'}
                  size="sm"
                  dot
                >
                  {isPaid ? 'Paid' : bill.status}
                </Badge>
              </div>
              <CardDescription>
                Due on {new Date(bill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </CardDescription>
            </div>

            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums block">
                ₹{Number(isPaid ? bill.totalAmount : bill.remainingBalance).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                {isPaid ? 'Amount Settled' : 'Total Payable'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Bill Line Items Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 divide-y divide-slate-200/60 text-xs">
              {bill.items.map((item) => (
                <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment & Receipt Action Buttons */}
            {!isPaid ? (
              <div className="space-y-2.5 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-sm font-semibold"
                  onClick={() => setShowUpiModal(true)}
                  leftIcon={<Smartphone className="w-4 h-4" />}
                >
                  Pay Now via UPI (0% Fee)
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onClick={() => setShowReportModal(true)}
                  >
                    I Have Already Paid (Submit UTR)
                  </Button>

                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setShowUpiModal(true)}
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    View QR
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link href={`/pay/${bill.id}`} target="_blank" className="w-full sm:flex-1">
                  <Button
                    variant="success"
                    size="md"
                    className="w-full"
                    leftIcon={<Receipt className="w-4 h-4" />}
                  >
                    View & Download Receipt
                  </Button>
                </Link>

                <Link href="/tenant/receipts" className="w-full sm:w-auto">
                  <Button variant="outline" size="md" className="w-full">
                    All Past Receipts
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900">All Rent Billed & Settled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any pending monthly invoices right now. Your next invoice will be issued by your landlord on schedule.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 3. Landlord Contact & Support Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Landlord Contact & Support</CardTitle>
              <CardDescription>{data.landlord?.name || 'Property Owner'}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.landlord?.phone && (
              <a
                href={`https://wa.me/91${data.landlord.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Chat on WhatsApp</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </a>
            )}

            {data.landlord?.phone && (
              <a
                href={`tel:${data.landlord.phone}`}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold">Call Landlord</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 text-slate-600">
            <span className="text-slate-500">Need something fixed in your flat?</span>
            <Link
              href="/tenant/maintenance"
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Raise Repair Request</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Modal 1: 1-Tap UPI Payment Dialog */}
      <Modal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        title="Pay Rent via UPI"
        description="Instant 0% gateway fee payment directly to your landlord."
      >
        <div className="space-y-4">
          {/* Tab Selector: UPI vs Bank */}
          <div className="flex p-1 rounded-xl bg-slate-100 gap-1 text-xs">
            <button
              onClick={() => setPayTab('UPI')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                payTab === 'UPI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              UPI Apps & QR
            </button>
            <button
              onClick={() => setPayTab('BANK')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                payTab === 'BANK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Direct Bank Account
            </button>
          </div>

          {payTab === 'UPI' ? (
            <div className="space-y-4 text-center">
              {/* QR Code */}
              <div className="w-48 h-48 mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                {data.landlord?.qrImageUrl && !qrError ? (
                  <img
                    src={data.landlord.qrImageUrl}
                    alt="Landlord UPI QR"
                    className="w-full h-full object-contain"
                    onError={() => setQrError(true)}
                  />
                ) : (
                  <div className="space-y-1">
                    <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Pay to UPI ID below
                    </span>
                  </div>
                )}
              </div>

              {/* UPI ID Copy Box */}
              {data.landlord?.upiId && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="text-left min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">UPI ID</span>
                    <span className="font-mono font-semibold text-slate-900 truncate block">
                      {data.landlord.upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1 shadow-xs hover:bg-slate-50 transition"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              {/* UPI App Launch Links */}
              {data.upiUrl && (
                <a href={data.upiUrl} className="block">
                  <Button variant="primary" size="lg" className="w-full">
                    Launch UPI App on Phone
                  </Button>
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="font-semibold text-slate-900">{data.landlord?.bankName || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-mono font-bold text-slate-900">{data.landlord?.bankAccountNumber || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-900 uppercase">{data.landlord?.bankIfsc || '—'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setShowUpiModal(false);
                setShowReportModal(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Already paid? Submit UTR reference
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Submit UTR Reference Dialog */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Submit Payment Reference"
        description="Share your UTR / transaction ID so your landlord can verify and issue your receipt."
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          {reportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reportSuccess}</span>
            </div>
          )}

          {reportError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{reportError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Amount Paid (₹) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={reportAmount}
              onChange={(e) => setReportAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              UPI Reference / UTR Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 428198732145 (12-digit UTR)"
              value={reportRef}
              onChange={(e) => setReportRef(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay from SBI account"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setShowReportModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submittingReport}
            >
              Submit Reference
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
