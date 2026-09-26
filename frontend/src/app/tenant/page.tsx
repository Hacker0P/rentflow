'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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
          transactionReference: reportRef,
          notes: reportNotes || undefined,
        }),
      });

      setReportSuccess('Payment confirmation recorded! Official receipt updated.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(null);
        fetchDashboard();
      }, 1800);
    } catch (err: any) {
      setReportError(err.message || 'Failed to submit payment confirmation.');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading your rental information...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasActiveLease) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Home className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Lease Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your account is not linked to an active rental flat. Please ask your landlord to add your phone number ({data?.tenant?.phone || 'registered number'}) to your lease agreement.
        </p>
      </div>
    );
  }

  const { tenant, unit, property, landlord, lease, currentBill, upiUrl } = data;

  const qrCodeUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUrl)}`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Welcome Home
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{tenant.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit {unit.unitNumber} • {property.name}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Resident
          </span>
        </div>
      </div>

      {/* Hero Bill Due Card */}
      {currentBill ? (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10 relative overflow-hidden border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    currentBill.status === 'OVERDUE'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {currentBill.status === 'OVERDUE' ? '⚠️ Payment Overdue' : '⏰ Payment Due'}
                </span>
                <span className="text-xs text-slate-300">
                  Due by {new Date(currentBill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Outstanding Balance</span>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                  ₹{currentBill.remainingBalance.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Breakdown chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 backdrop-blur-md">
                  Rent: ₹{lease.monthlyRent.toLocaleString('en-IN')}
                </span>
                {lease.maintenanceAmount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 backdrop-blur-md">
                    Maintenance: ₹{lease.maintenanceAmount.toLocaleString('en-IN')}
                  </span>
                )}
                {currentBill.paidAmount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Paid: ₹{currentBill.paidAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => setShowUpiModal(true)}
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 text-center"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay via UPI App / QR</span>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition flex items-center justify-center gap-2 text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>I Have Paid (Submit UTR)</span>
              </button>

              <Link
                href={`/pay/${currentBill.id}`}
                target="_blank"
                className="text-center text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1 mt-1 font-medium"
              >
                <span>View itemized bill</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                All Caught Up!
              </span>
              <h2 className="text-xl font-bold text-slate-900">Zero Dues Pending</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All rent and maintenance charges have been settled. Your next invoice will be issued on the 1st.
              </p>
            </div>
          </div>

          <Link
            href="/tenant/receipts"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>View Paid Receipts</span>
          </Link>
        </div>
      )}

      {/* Two Column Layout: Lease Details and Landlord Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Lease Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Lease Agreement Details</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Monthly Rent</span>
              <span className="font-bold text-slate-800 text-sm">₹{lease.monthlyRent.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Maintenance Charge</span>
              <span className="font-bold text-slate-800 text-sm">₹{lease.maintenanceAmount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rent Due Day</span>
              <span className="font-bold text-slate-800 text-sm">{lease.rentDueDay}th of every month</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Security Deposit Held</span>
              <span className="font-bold text-emerald-700 text-sm">₹{lease.securityDeposit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Lease Started: {new Date(lease.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            <span className="text-emerald-600 font-bold">100% Protected</span>
          </div>
        </div>

        {/* Landlord Contact Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Landlord & Support</h3>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block">Property Owner</span>
            <span className="font-bold text-slate-800 text-sm">{landlord.name}</span>
            <span className="text-xs text-slate-500 block">{landlord.email}</span>
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={`tel:${landlord.phone}`}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>Call Landlord</span>
            </a>

            <a
              href={`https://wa.me/${landlord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hi ${landlord.name}, this is ${tenant.name} from Unit ${unit.unitNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Payment Options Modal (UPI & Direct Bank Transfer) */}
      {showUpiModal && currentBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Choose Payment Method</h3>
                  <p className="text-[11px] text-slate-500">Rent Balance: ₹{currentBill.remainingBalance.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpiModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Method Segmented Tabs */}
            <div className="p-4 border-b border-slate-100 flex gap-2">
              <button
                onClick={() => setPayTab('UPI')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  payTab === 'UPI'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI App / QR</span>
              </button>
              <button
                onClick={() => setPayTab('BANK')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  payTab === 'BANK'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Bank IMPS / NEFT</span>
              </button>
            </div>

            <div className="p-6">
              {payTab === 'UPI' ? (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Amount to Pay
                  </span>
                  <span className="text-3xl font-black text-slate-900 mb-3">
                    ₹{currentBill.remainingBalance.toLocaleString('en-IN')}
                  </span>

                  {/* QR Code */}
                  <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={170}
                      height={170}
                      className="rounded-xl"
                    />
                  </div>

                  <span className="text-[11px] text-slate-400 mt-2 text-center">
                    Scan with Google Pay, PhonePe, Paytm, or BHIM
                  </span>

                  {/* UPI ID Copy */}
                  <div className="w-full mt-4 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">UPI ID</span>
                      <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                        {landlord.upiId}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0 transition"
                    >
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Direct Mobile Intent */}
                  {upiUrl && (
                    <a
                      href={upiUrl}
                      className="w-full mt-3 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 text-center shadow-md shadow-emerald-950/20"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Launch UPI App on Phone</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Amount to Transfer
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      ₹{currentBill.remainingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank Name</span>
                        <span className="font-bold text-slate-800">{landlord.bankName || 'HDFC Bank Ltd'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Beneficiary Name</span>
                        <span className="font-bold text-slate-800">{landlord.name}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Account Number</span>
                        <span className="font-bold font-mono text-slate-900">
                          {landlord.bankAccountNumber || '50100492817291'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(landlord.bankAccountNumber || '50100492817291');
                          setCopiedBankAcc(true);
                          setTimeout(() => setCopiedBankAcc(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0 transition"
                      >
                        {copiedBankAcc ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">IFSC Code</span>
                        <span className="font-bold font-mono text-slate-900 uppercase">
                          {landlord.bankIfsc || 'HDFC0000123'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(landlord.bankIfsc || 'HDFC0000123');
                          setCopiedBankIfsc(true);
                          setTimeout(() => setCopiedBankIfsc(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shrink-0 transition"
                      >
                        {copiedBankIfsc ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    Transfer via NEFT, RTGS, or IMPS from your mobile banking app.
                  </p>
                </div>
              )}

              {/* Bottom Quick Switch to Report Payment */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUpiModal(false);
                    setShowReportModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>I have made the transfer &rarr; Submit UTR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Report Payment Modal */}
      {showReportModal && currentBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Submit Payment Proof</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess && (
              <div className="my-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reportSuccess}</span>
              </div>
            )}

            {reportError && (
              <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reportError}</span>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={currentBill.remainingBalance}
                  value={reportAmount}
                  onChange={(e) => setReportAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-bold"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Balance Due: ₹{currentBill.remainingBalance.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={reportMethod}
                  onChange={(e) => setReportMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                  <option value="CASH">Cash directly to Landlord</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI/123456789012 or NEFT ref"
                  value={reportRef}
                  onChange={(e) => setReportRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Optional Note for Landlord
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid from HDFC account"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || reportAmount <= 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
