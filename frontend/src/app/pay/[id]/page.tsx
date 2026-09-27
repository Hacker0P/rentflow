'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Copy,
  Printer,
  Smartphone,
  ShieldCheck,
  MessageCircle,
  Phone,
  Building,
  Check,
  Send,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface PublicInvoice {
  id: string;
  billingMonth: string;
  dueDate: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
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
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference?: string;
  }>;
  tenant: {
    name: string;
    phone: string;
    email?: string;
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
    phone?: string;
    upiId: string;
    qrImageUrl?: string;
    panNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  };
}

export default function TenantInvoicePaymentPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);
  const [copiedBankIfsc, setCopiedBankIfsc] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [activeTab, setActiveTab] = useState<'UPI' | 'BANK'>('UPI');
  const [reportedUtr, setReportedUtr] = useState('');
  const [copiedUtrMsg, setCopiedUtrMsg] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await apiRequest<PublicInvoice>(`/public/invoices/${invoiceId}`);
        setInvoice(res.data);
      } catch (err: any) {
        setError(err.message || 'Invoice not found or expired.');
      } finally {
        setLoading(false);
      }
    }

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const indianGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return { hindi: 'Shubh Prabhat', english: 'Good Morning' };
    if (hour >= 12 && hour < 17) return { hindi: 'Shubh Dopahar', english: 'Good Afternoon' };
    return { hindi: 'Shubh Sandhya', english: 'Good Evening' };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Invoice Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Please check the link provided by your landlord.'}</p>
        </div>
      </div>
    );
  }

  const billingDate = new Date(invoice.billingMonth);
  const formattedMonth = billingDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Construct UPI Intent URI
  const upiIntent = invoice.landlord.upiId
    ? `upi://pay?pa=${encodeURIComponent(invoice.landlord.upiId)}&pn=${encodeURIComponent(
        invoice.landlord.name
      )}&am=${invoice.remainingBalance}&cu=INR&tn=${encodeURIComponent(
        `Rent Unit ${invoice.unit.unitNumber} ${formattedMonth}`
      )}`
    : '';

  const qrCodeUrl =
    invoice.landlord.qrImageUrl ||
    (upiIntent ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntent)}` : '');

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(invoice.landlord.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID IN FULL
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> PARTIALLY PAID
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> PAYMENT OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> PAYMENT PENDING
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-6 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Print / Top Navigation Bar (Hidden in Print) */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight block leading-none">
                RentFlow India
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                Official Rent Receipt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-2xl shadow-xs transition active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Official Receipt</span>
            </button>
          </div>
        </div>

        {/* Main Invoice Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:shadow-none print:border-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  🇮🇳 {indianGreeting.hindi}
                </span>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Rent & Maintenance Bill
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{invoice.property.name}</h1>
              <p className="text-slate-400 text-xs mt-1">{invoice.property.address}</p>
            </div>

            <div className="text-left sm:text-right">
              <div className="mb-2">{getStatusBadge()}</div>
              <span className="text-xs text-slate-300 block font-mono">Invoice #{invoice.id.slice(0, 8)}</span>
              <span className="text-xs text-slate-400 block">Period: {formattedMonth}</span>
            </div>
          </div>

          {/* Parties & Dates */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Resident Tenant
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                Namaste, {invoice.tenant.name} Ji 🙏
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Unit {invoice.unit.unitNumber} {invoice.unit.floor ? `(Floor ${invoice.unit.floor})` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Phone: {invoice.tenant.phone}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Landlord / Owner Details
              </span>
              <h3 className="font-bold text-slate-900 text-base">{invoice.landlord.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{invoice.landlord.email}</p>
              {invoice.landlord.panNumber && (
                <p className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                  Landlord PAN: <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200">{invoice.landlord.panNumber}</span>
                </p>
              )}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Due Date: <strong>{dueDateFormatted}</strong></span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-6 sm:p-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Itemized Rent & Maintenance</h4>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{item.description}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 rounded-2xl p-5 border border-slate-200/80 gap-4">
              <div className="space-y-1 text-xs text-slate-600">
                <div>Total Billed: <strong className="text-slate-800">₹{invoice.totalAmount.toLocaleString('en-IN')}</strong></div>
                <div>Amount Paid: <strong className="text-emerald-700 font-bold">₹{invoice.paidAmount.toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Remaining Rent Balance
                </span>
                <span className={`text-3xl font-black block tracking-tight ${invoice.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{invoice.remainingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive UPI / Bank Transfer Payment Section */}
          {invoice.remainingBalance > 0 ? (
            <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-50/60 to-white border-t border-slate-200 print:hidden space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Pay Rent via UPI / QR / Bank</h3>
                    <p className="text-xs text-slate-500">Scan with Google Pay, PhonePe, Paytm, BHIM, or use Net Banking</p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('UPI')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'UPI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    UPI Apps & QR
                  </button>
                  <button
                    onClick={() => setActiveTab('BANK')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'BANK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Bank IMPS / NEFT
                  </button>
                </div>
              </div>

              {activeTab === 'UPI' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-emerald-200/80 shadow-xs">
                    <div className="max-w-[210px] w-full aspect-square flex items-center justify-center p-2 border border-slate-100 rounded-2xl shadow-2xs mb-2">
                      <img
                        src={
                          qrError && upiIntent
                            ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntent)}`
                            : qrCodeUrl
                        }
                        alt="UPI Payment QR Code"
                        width={200}
                        height={200}
                        className="rounded-xl object-contain max-h-[200px]"
                        onError={() => setQrError(true)}
                      />
                    </div>
                    {!qrError && invoice.landlord.qrImageUrl && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Landlord&apos;s Verified QR
                      </span>
                    )}
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant 1-Tap UPI Transfer</span>
                    </div>
                  </div>

                  {/* Direct Actions & UPI App Links */}
                  <div className="space-y-4">
                    {invoice.landlord.upiId && (
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Landlord UPI ID
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-slate-800 break-all">
                            {invoice.landlord.upiId}
                          </span>
                          <button
                            onClick={handleCopyUpi}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0 transition flex items-center gap-1"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Mobile App Buttons */}
                    {upiIntent && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Tap to Pay on Mobile
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={upiIntent}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center border border-slate-200 transition"
                          >
                            Google Pay
                          </a>
                          <a
                            href={upiIntent}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center border border-slate-200 transition"
                          >
                            PhonePe
                          </a>
                          <a
                            href={upiIntent}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center border border-slate-200 transition"
                          >
                            Paytm
                          </a>
                          <a
                            href={upiIntent}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition shadow-xs"
                          >
                            Any UPI App
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Notify Landlord on WhatsApp */}
                    {invoice.landlord.phone && (
                      <a
                        href={`https://wa.me/${invoice.landlord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Namaste ${invoice.landlord.name} Ji, I have paid ₹${invoice.remainingBalance} for Unit ${invoice.unit.unitNumber} rent (${formattedMonth}). Invoice #${invoice.id.slice(0, 8)}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Notify Landlord on WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* Bank Transfer Details */
                <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Beneficiary</span>
                      <span className="font-bold text-slate-800">{invoice.landlord.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
                      <span className="font-bold text-slate-800">{invoice.landlord.bankName || 'HDFC Bank'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Number</span>
                      <span className="font-bold font-mono text-slate-800">
                        {invoice.landlord.bankAccountNumber || '50100482910482'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invoice.landlord.bankAccountNumber || '50100482910482');
                        setCopiedBankAcc(true);
                        setTimeout(() => setCopiedBankAcc(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      {copiedBankAcc ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">IFSC Code</span>
                      <span className="font-bold font-mono text-slate-800">{invoice.landlord.bankIfsc || 'HDFC0001234'}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invoice.landlord.bankIfsc || 'HDFC0001234');
                        setCopiedBankIfsc(true);
                        setTimeout(() => setCopiedBankIfsc(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700"
                    >
                      {copiedBankIfsc ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-emerald-50/50 border-t border-emerald-100 text-center print:border-none">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Thank You! Payment Received</h3>
              <p className="text-xs text-emerald-700 mt-1">
                This invoice has been settled in full. Keep this document as your verified rent receipt.
              </p>
            </div>
          )}

          {/* Payment Receipts History */}
          {invoice.payments.length > 0 && (
            <div className="p-6 sm:p-8 border-t border-slate-200/80 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Payment History & Receipts
              </h4>
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Receipt Date</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">Reference UTR</th>
                      <th className="py-2.5 px-4 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{p.paymentMethod}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {p.transactionReference || 'UTR Verified'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          +₹{p.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="p-4 bg-slate-50 text-center border-t border-slate-100 text-[11px] text-slate-400">
            Generated securely by RentFlow Platform • Verified digital rent invoice compliant with Indian IT Act.
          </div>
        </div>
      </div>
    </div>
  );
}
