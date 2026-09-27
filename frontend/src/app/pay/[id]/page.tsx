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
  ChevronDown,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  const amountToPay = useMemo(() => {
    if (!invoice) return 0;
    if (invoice.isFullyPaid) return invoice.totalAmount;
    return invoice.remainingBalance > 0 ? invoice.remainingBalance : invoice.totalAmount;
  }, [invoice]);

  const upiIntentUri = useMemo(() => {
    if (!invoice?.landlord?.upiId) return '';
    const pa = encodeURIComponent(invoice.landlord.upiId.trim());
    const pn = encodeURIComponent(invoice.landlord.name || 'RentFlow Landlord');
    const am = amountToPay.toFixed(2);
    const tn = encodeURIComponent(`Rent Unit ${invoice.unit.unitNumber} ${invoice.billingMonth}`);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }, [invoice, amountToPay]);

  const qrCodeUrl = useMemo(() => {
    if (invoice?.landlord?.qrImageUrl) {
      return invoice.landlord.qrImageUrl;
    }
    if (upiIntentUri) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUri)}`;
    }
    return '';
  }, [invoice, upiIntentUri]);

  const handleCopyUpi = () => {
    if (!invoice?.landlord?.upiId) return;
    navigator.clipboard.writeText(invoice.landlord.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyBankAcc = () => {
    if (!invoice?.landlord?.bankAccountNumber) return;
    navigator.clipboard.writeText(invoice.landlord.bankAccountNumber);
    setCopiedBankAcc(true);
    setTimeout(() => setCopiedBankAcc(false), 2000);
  };

  const handleCopyBankIfsc = () => {
    if (!invoice?.landlord?.bankIfsc) return;
    navigator.clipboard.writeText(invoice.landlord.bankIfsc);
    setCopiedBankIfsc(true);
    setTimeout(() => setCopiedBankIfsc(false), 2000);
  };

  const handleSendUtrWhatsApp = () => {
    if (!invoice || !invoice.landlord?.phone) return;
    const cleanPhone = invoice.landlord.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Namaste ${invoice.landlord.name} Ji,\n\nI have completed the rent payment of ₹${amountToPay.toLocaleString('en-IN')} for Unit ${invoice.unit.unitNumber} (${invoice.property.name}).\n\nUTR / Ref: ${reportedUtr}\n\nPlease verify and acknowledge the receipt.\n\nThank you,\n${invoice.tenant.name}`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center animate-pulse text-white shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
        <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'The requested invoice link does not exist or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.isFullyPaid || invoice.status === 'PAID';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex justify-center selection:bg-blue-600 selection:text-white py-0 sm:py-6 px-0 sm:px-4">
      {/* Mobile Checkout App Sheet */}
      <div className="w-full max-w-md min-h-screen sm:min-h-0 bg-slate-50 rounded-none sm:rounded-3xl shadow-2xl flex flex-col justify-between p-4 sm:p-6 pb-safe border-0 sm:border border-slate-200">
        <div className="space-y-4">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">RentFlow</span>
            </div>

            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Direct UPI • 0% Fee
            </span>
          </div>

          {/* Amount Hero Card */}
          <div className={`p-5 rounded-2xl border text-center space-y-1 shadow-sm ${isPaid ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white border-slate-200'}`}>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
              {isPaid ? 'Payment Settled' : 'Total Amount Due'}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums">
              ₹{Number(amountToPay).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-600">
              Unit {invoice.unit.unitNumber}, {invoice.property.name} • <span className="font-semibold">{invoice.billingMonth}</span>
            </p>
            <div className="pt-1">
              <Badge variant={isPaid ? 'success' : invoice.status === 'OVERDUE' ? 'error' : 'warning'} size="sm" dot>
                {isPaid ? 'Settled & Verified' : invoice.status}
              </Badge>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 text-xs">
            {invoice.items.map((item) => (
              <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                <span className="text-slate-600 font-medium">{item.description}</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  ₹{Number(item.amount).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Landlord Contact Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Payee (Landlord)</span>
              <span className="font-bold text-slate-900">{invoice.landlord?.name}</span>
              {invoice.landlord?.panNumber && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  PAN: {invoice.landlord.panNumber}
                </span>
              )}
            </div>
            {invoice.landlord?.phone && (
              <a
                href={`tel:${invoice.landlord.phone}`}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1 active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Payment Section (when not paid) */}
          {!isPaid ? (
            <div className="space-y-3 pt-1">
              {/* Payment Tabs: UPI vs Bank */}
              <div className="flex p-1 rounded-xl bg-slate-200/70 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('UPI')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'UPI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Direct UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('BANK')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'BANK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Bank Transfer / NEFT
                </button>
              </div>

              {activeTab === 'UPI' ? (
                <div className="space-y-3">
                  {/* 1-Tap UPI Launch Button */}
                  {upiIntentUri && (
                    <a
                      href={upiIntentUri}
                      className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Pay via UPI (GPay / PhonePe / Paytm)</span>
                    </a>
                  )}

                  {/* QR Code Card */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Or scan this QR code with any UPI app:
                    </span>

                    {qrCodeUrl && !qrError ? (
                      <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border-2 border-slate-100 shadow-xs flex items-center justify-center">
                        <img
                          src={qrCodeUrl}
                          alt="Landlord UPI QR Code"
                          className="w-full h-full object-contain"
                          onError={() => setQrError(true)}
                        />
                      </div>
                    ) : (
                      <div className="w-44 h-44 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <QrCode className="w-8 h-8" />
                        <span className="text-xs">QR unavailable</span>
                      </div>
                    )}

                    {invoice.landlord?.upiId && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-mono text-slate-700 truncate">{invoice.landlord.upiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1 active:scale-95"
                        >
                          {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UTR Report Box */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 block">Paid already? Notify Landlord:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter 12-digit UPI Ref / UTR"
                        value={reportedUtr}
                        onChange={(e) => setReportedUtr(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-slate-50"
                      />
                      <button
                        type="button"
                        disabled={!reportedUtr.trim() || !invoice.landlord?.phone}
                        onClick={handleSendUtrWhatsApp}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 flex items-center gap-1 shrink-0 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Bank Transfer Mode */
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Name</span>
                        <span className="font-bold text-slate-900">{invoice.landlord?.bankName || 'Not configured'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account Number</span>
                        <span className="font-mono font-bold text-slate-900">{invoice.landlord?.bankAccountNumber || '—'}</span>
                      </div>
                      {invoice.landlord?.bankAccountNumber && (
                        <button
                          type="button"
                          onClick={handleCopyBankAcc}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1 active:scale-95"
                        >
                          {copiedBankAcc ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBankAcc ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-900">{invoice.landlord?.bankIfsc || '—'}</span>
                      </div>
                      {invoice.landlord?.bankIfsc && (
                        <button
                          type="button"
                          onClick={handleCopyBankIfsc}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1 active:scale-95"
                        >
                          {copiedBankIfsc ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBankIfsc ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Settled Receipt State */
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-950 text-sm">Rent Fully Settled</h4>
              <p className="text-emerald-800 leading-snug">
                This bill has been paid and verified. Official rent receipt is registered for this period.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 pt-4">
          <span>RentFlow India • Direct Bank Settlement • No Middleman Fees</span>
        </div>
      </div>
    </div>
  );
}
