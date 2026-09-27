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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Invoice Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Please check the link provided by your landlord.'}</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.isFullyPaid || invoice.status === 'PAID';
  const amountToPay = isPaid ? invoice.totalAmount : invoice.remainingBalance;

  // Build standard Indian UPI URL
  const upiUrl = invoice.landlord?.upiId
    ? `upi://pay?pa=${encodeURIComponent(invoice.landlord.upiId)}&pn=${encodeURIComponent(invoice.landlord.name || 'Landlord')}&am=${amountToPay}&cu=INR&tn=${encodeURIComponent(`Rent Unit ${invoice.unit.unitNumber} ${invoice.billingMonth}`)}`
    : null;

  const handleCopyUpi = () => {
    if (invoice.landlord?.upiId) {
      navigator.clipboard.writeText(invoice.landlord.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleSendUtrWhatsApp = () => {
    if (!invoice.landlord?.phone) return;
    const cleanPhone = invoice.landlord.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Namaste ${invoice.landlord.name} Ji,\n\nI have completed the rent payment of ₹${amountToPay.toLocaleString('en-IN')} for Unit ${invoice.unit.unitNumber} (${invoice.property.name}).\n\nUTR / Ref: ${reportedUtr}\n\nPlease verify and acknowledge the receipt.\n\nThank you,\n${invoice.tenant.name}`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Brand Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">RentFlow</span>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Direct UPI • 0% Fee
          </span>
        </div>

        {/* Invoice Main Card */}
        <Card className={isPaid ? 'border-emerald-200/80' : ''}>
          <CardHeader>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Rent Invoice • {invoice.billingMonth}</CardTitle>
                <Badge
                  variant={isPaid ? 'success' : invoice.status === 'OVERDUE' ? 'error' : 'warning'}
                  size="sm"
                  dot
                >
                  {isPaid ? 'Settled' : invoice.status}
                </Badge>
              </div>
              <CardDescription>
                Unit {invoice.unit.unitNumber}, {invoice.property.name}
              </CardDescription>
            </div>

            <div className="text-right">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums block">
                ₹{Number(amountToPay).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                {isPaid ? 'Amount Settled' : 'Total Payable'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Breakdown List */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 divide-y divide-slate-200/60 text-xs">
              {invoice.items.map((item) => (
                <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                  <span className="text-slate-600">{item.description}</span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Landlord Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Payee (Landlord)</span>
                <span className="font-semibold text-slate-900">{invoice.landlord?.name}</span>
                {invoice.landlord?.panNumber && (
                  <span className="text-[11px] text-slate-500 font-mono block">
                    PAN: {invoice.landlord.panNumber}
                  </span>
                )}
              </div>
              {invoice.landlord?.phone && (
                <a
                  href={`tel:${invoice.landlord.phone}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Call Landlord
                </a>
              )}
            </div>

            {/* Payment Section (when not paid) */}
            {!isPaid ? (
              <div className="space-y-4 pt-2">
                {/* Payment Tabs: UPI vs Bank */}
                <div className="flex p-1 rounded-xl bg-slate-100 gap-1 text-xs">
                  <button
                    onClick={() => setActiveTab('UPI')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                      activeTab === 'UPI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    UPI Apps & QR
                  </button>
                  <button
                    onClick={() => setActiveTab('BANK')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                      activeTab === 'BANK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Bank Transfer (IMPS)
                  </button>
                </div>

                {activeTab === 'UPI' ? (
                  <div className="space-y-4 text-center">
                    {/* QR Code Container */}
                    <div className="w-48 h-48 mx-auto rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                      {invoice.landlord?.qrImageUrl && !qrError ? (
                        <img
                          src={invoice.landlord.qrImageUrl}
                          alt="Landlord UPI QR"
                          className="w-full h-full object-contain"
                          onError={() => setQrError(true)}
                        />
                      ) : (
                        <div className="space-y-1">
                          <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Scan with GPay or PhonePe
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Copy UPI Box */}
                    {invoice.landlord?.upiId && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">UPI ID</span>
                          <span className="font-mono font-semibold text-slate-900 truncate block">
                            {invoice.landlord.upiId}
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

                    {/* 1-Tap Mobile UPI Launcher */}
                    {upiUrl && (
                      <a href={upiUrl} className="block">
                        <Button variant="primary" size="lg" className="w-full">
                          Pay ₹{amountToPay.toLocaleString('en-IN')} on Mobile UPI
                        </Button>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Bank Name</span>
                        <span className="font-semibold text-slate-900">{invoice.landlord?.bankName || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Account Number</span>
                        <span className="font-mono font-bold text-slate-900">{invoice.landlord?.bankAccountNumber || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">IFSC Code</span>
                        <span className="font-mono font-bold text-slate-900 uppercase">{invoice.landlord?.bankIfsc || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit UTR Section */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-900 block">
                    Already transferred rent? Send UTR to Landlord:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter 12-digit UPI Ref / UTR"
                      value={reportedUtr}
                      onChange={(e) => setReportedUtr(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!reportedUtr.trim()}
                      onClick={handleSendUtrWhatsApp}
                      leftIcon={<Send className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      WhatsApp Landlord
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Settled Official Receipt View */
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>This rent invoice has been settled and verified.</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print / Save Official Receipt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
