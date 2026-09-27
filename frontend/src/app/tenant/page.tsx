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
      fetchDashboard();
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
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 text-center max-w-xl mx-auto shadow-sm my-8 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
          <Home className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Rental Flat Not Linked</span>
          </span>
          <h3 className="text-xl font-black text-slate-900">No Active Lease Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Your tenant account is not linked to an active flat yet. Follow the steps below based on your role:
          </p>
        </div>

        {/* Profile Details Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs space-y-2">
          <div className="font-bold text-slate-700 flex items-center justify-between">
            <span>Your Profile Details</span>
            <span className="text-[10px] text-slate-400 font-medium">Logged In</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Mobile Number</span>
              <span className="font-bold text-slate-800">{data?.tenant?.phone || 'Not linked'}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Email / Name</span>
              <span className="font-bold text-slate-800 truncate block">{data?.tenant?.email || data?.tenant?.name || 'Tenant'}</span>
            </div>
          </div>
        </div>

        {/* 2 Scenarios */}
        <div className="grid grid-cols-1 gap-3 text-left">
          {/* Scenario A: For Tenants */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1.5">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
              <span>If you are a Tenant:</span>
            </div>
            <p className="text-slate-600 pl-6.5 leading-relaxed text-[11px]">
              Ask your landlord to create a lease in their RentFlow dashboard using your mobile number (<span className="font-bold text-slate-800">{data?.tenant?.phone || 'registered number'}</span>). Once they activate it, click below to refresh!
            </p>
          </div>

          {/* Scenario B: For Landlords */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
              <span>If you are testing as a Landlord:</span>
            </div>
            <p className="text-slate-600 pl-6.5 leading-relaxed text-[11px]">
              Go to your Landlord Dashboard, add a property/unit, and create a lease agreement under Tenants.
            </p>
            <div className="pl-6.5 pt-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
              >
                <span>Go to Landlord Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={async () => {
              setRefreshing(true);
              await fetchDashboard();
              setRefreshing(false);
            }}
            disabled={refreshing}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Checking...' : 'Check Again / Refresh'}</span>
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  const { tenant, unit, property, landlord, lease, currentBill, upiUrl } = data;

  const localQr = typeof window !== 'undefined' ? localStorage.getItem('rentflow_landlord_qr') : null;
  const qrCodeUrl =
    landlord.qrImageUrl ||
    localQr ||
    (upiUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUrl)}` : '');

  // UPI App deep link strings
  const upiIntentString = upiUrl || (landlord.upiId && currentBill
    ? `upi://pay?pa=${encodeURIComponent(landlord.upiId)}&pn=${encodeURIComponent(landlord.name)}&am=${currentBill.remainingBalance}&cu=INR&tn=${encodeURIComponent(`Rent Unit ${unit.unitNumber} ${currentMonthYear}`)}`
    : '');

  return (
    <div className="space-y-6">
      {/* 1. Indian Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-5 sm:p-7 text-white shadow-md border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>{indianGreeting.hindi}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Active Resident</span>
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {currentDateString}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
            <span>Namaste, {tenant.name} Ji</span>
            <span className="inline-block text-2xl">🙏</span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Welcome home to <strong className="text-white font-bold">Unit {unit.unitNumber}</strong> at{' '}
            <strong className="text-teal-300 font-semibold">{property.name}</strong>. Here is your rent status and payment hub for{' '}
            <strong className="text-teal-400 font-semibold">{currentMonthYear}</strong>.
          </p>
        </div>

        {/* Landlord Quick Contacts */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <a
            href={`https://wa.me/${landlord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Namaste ${landlord.name} Ji, this is ${tenant.name} from Unit ${unit.unitNumber} (${property.name}).`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Landlord</span>
          </a>
          <a
            href={`tel:${landlord.phone}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        </div>

        <div className="absolute right-0 top-0 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Quick Action Shortcuts for Resident */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => {
            if (currentBill) setShowUpiModal(true);
          }}
          disabled={!currentBill}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition flex items-center gap-3 group text-left disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Pay via UPI / QR</span>
            <span className="text-[10px] text-slate-400 block truncate">Instant scan & pay</span>
          </div>
        </button>

        <button
          onClick={() => {
            if (currentBill) setShowReportModal(true);
          }}
          disabled={!currentBill}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition flex items-center gap-3 group text-left disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Submit UTR Proof</span>
            <span className="text-[10px] text-slate-400 block truncate">Report paid rent</span>
          </div>
        </button>

        <Link
          href="/tenant/receipts"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Payment History</span>
            <span className="text-[10px] text-slate-400 block truncate">Monthly bills & receipts</span>
          </div>
        </Link>

        <Link
          href="/tenant/maintenance"
          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate">Flat Repairs</span>
            <span className="text-[10px] text-slate-400 block truncate">Request maintenance</span>
          </div>
        </Link>
      </div>

      {/* 3. Hero Bill Due Card */}
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
                  {currentBill.status === 'OVERDUE' ? '⚠️ Payment Overdue' : '⏰ Rent Bill Due'}
                </span>
                <span className="text-xs text-slate-300">
                  Due by {new Date(currentBill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Outstanding Rent Balance</span>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                  ₹{currentBill.remainingBalance.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Breakdown chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-slate-200 backdrop-blur-md">
                  Rent: ₹{lease.monthlyRent.toLocaleString('en-IN')}
                </span>
                {lease.maintenanceAmount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-white/10 text-slate-200 backdrop-blur-md">
                    Maintenance: ₹{lease.maintenanceAmount.toLocaleString('en-IN')}
                  </span>
                )}
                {currentBill.paidAmount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Paid: ₹{currentBill.paidAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                onClick={() => setShowUpiModal(true)}
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 text-center active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay via UPI App / QR</span>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition flex items-center justify-center gap-2 text-center active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>I Have Paid (Submit UTR)</span>
              </button>

              <Link
                href={`/pay/${currentBill.id}`}
                target="_blank"
                className="text-center text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1 mt-1 font-medium"
              >
                <span>View itemized rent invoice</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                Badhai Ho! 🎉 All Rent Settled
              </span>
              <h2 className="text-xl font-bold text-slate-900">Zero Dues Pending for {currentMonthYear}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All monthly rent and maintenance charges have been paid. Your next invoice will be issued on the 1st of next month.
              </p>
            </div>
          </div>

          <Link
            href="/tenant/receipts"
            className="px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Download Rent Receipts</span>
          </Link>
        </div>
      )}

      {/* 4. Two Column Layout: Lease Details and Landlord Contact */}
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
                `Namaste ${landlord.name} Ji, this is ${tenant.name} from Unit ${unit.unitNumber} (${property.name}).`
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

                  {/* QR Image Display */}
                  <div className="p-3 bg-white border border-slate-200 rounded-3xl shadow-sm mb-4 relative max-w-[210px] w-full aspect-square flex items-center justify-center">
                    {qrCodeUrl && !qrError ? (
                      <img
                        src={qrCodeUrl}
                        alt="Landlord UPI QR"
                        onError={() => setQrError(true)}
                        className="w-full h-full object-contain rounded-2xl"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <span className="text-[11px] text-slate-400">QR code unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* Landlord UPI ID Copy */}
                  {landlord.upiId && (
                    <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between mb-4">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Landlord UPI ID
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                          {landlord.upiId}
                        </span>
                      </div>
                      <button
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition flex items-center gap-1 shrink-0"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {/* Direct Mobile UPI Intent Buttons */}
                  {upiIntentString && (
                    <div className="w-full space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block text-center uppercase tracking-wider">
                        Tap to Pay Directly with App
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={upiIntentString}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 text-xs font-bold border border-slate-200 text-center transition flex items-center justify-center gap-1.5"
                        >
                          <span>Google Pay</span>
                        </a>
                        <a
                          href={upiIntentString}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-800 text-xs font-bold border border-slate-200 text-center transition flex items-center justify-center gap-1.5"
                        >
                          <span>PhonePe</span>
                        </a>
                        <a
                          href={upiIntentString}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-800 text-xs font-bold border border-slate-200 text-center transition flex items-center justify-center gap-1.5"
                        >
                          <span>Paytm</span>
                        </a>
                        <a
                          href={upiIntentString}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                        >
                          <span>Any UPI App</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Direct Bank Transfer Tab */
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Please verify landlord name and IFSC code carefully before confirming payment via Net Banking.
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Beneficiary</span>
                        <span className="font-bold text-slate-800">{landlord.name}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
                        <span className="font-bold text-slate-800">{landlord.bankName || 'HDFC Bank'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Number</span>
                        <span className="font-bold font-mono text-slate-800">
                          {landlord.bankAccountNumber || '50100482910482'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(landlord.bankAccountNumber || '50100482910482');
                          setCopiedBankAcc(true);
                          setTimeout(() => setCopiedBankAcc(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                      >
                        {copiedBankAcc ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">IFSC Code</span>
                        <span className="font-bold font-mono text-slate-800">{landlord.bankIfsc || 'HDFC0001234'}</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(landlord.bankIfsc || 'HDFC0001234');
                          setCopiedBankIfsc(true);
                          setTimeout(() => setCopiedBankIfsc(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                      >
                        {copiedBankIfsc ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Paid already?</span>
              <button
                onClick={() => {
                  setShowUpiModal(false);
                  setShowReportModal(true);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Submit 12-digit UTR</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Report UTR Payment Modal */}
      {showReportModal && currentBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Submit Payment Proof</h3>
                  <p className="text-[11px] text-slate-400">Notify your landlord instantly</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold">{reportSuccess}</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Your landlord has been alerted. You can also send them the payment proof directly on WhatsApp with 1 tap:
                </p>
                {landlord?.phone && (
                  <a
                    href={`https://wa.me/${landlord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Namaste ${landlord.name} Ji 🙏, I have transferred the rent of ₹${reportAmount} for Unit ${unit.unitNumber} (${property.name}) via ${reportMethod}.${reportRef ? `\n🔢 UTR Reference: ${reportRef}` : ''}\n\nKindly check and verify on RentFlow. Thank you!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Notify Landlord on WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSuccess(null);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <>
                {reportError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}

                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (₹)</label>
                    <input
                      type="number"
                      required
                      value={reportAmount}
                      onChange={(e) => setReportAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={reportMethod}
                      onChange={(e) => setReportMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="BANK_TRANSFER">Bank IMPS / NEFT Transfer</option>
                      <option value="CASH">Cash directly handed over</option>
                      <option value="OTHER">Cheque / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      12-Digit UTR / Transaction Reference (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 427189038291"
                      value={reportRef}
                      onChange={(e) => setReportRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notes for Landlord (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Paid from HDFC account ending in 4102..."
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {submittingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{submittingReport ? 'Submitting...' : 'Record Payment Proof'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
