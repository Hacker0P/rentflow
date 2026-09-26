'use client';

import { useEffect, useState } from 'react';
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
  Share2,
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
  const [copied, setCopied] = useState(false);

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
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
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
  const upiIntent = `upi://pay?pa=${encodeURIComponent(invoice.landlord.upiId)}&pn=${encodeURIComponent(
    invoice.landlord.name
  )}&am=${invoice.remainingBalance}&cu=INR&tn=${encodeURIComponent(
    `Rent Unit ${invoice.unit.unitNumber} ${formattedMonth}`
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntent)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(invoice.landlord.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Print / Top Navigation Bar (Hidden in Print) */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">RentFlow</span>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Official Receipt
          </button>
        </div>

        {/* Main Invoice Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:shadow-none print:border-none">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                Official Rent & Maintenance Invoice
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight">{invoice.property.name}</h1>
              <p className="text-slate-400 text-xs mt-1">{invoice.property.address}</p>
            </div>

            <div className="text-left sm:text-right">
              <div className="mb-2">{getStatusBadge()}</div>
              <span className="text-xs text-slate-400 block font-mono">Invoice #{invoice.id.slice(0, 8)}</span>
              <span className="text-xs text-slate-400 block">Period: {formattedMonth}</span>
            </div>
          </div>

          {/* Parties & Dates */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tenant Details
              </span>
              <h3 className="font-bold text-slate-800 text-base">{invoice.tenant.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Unit {invoice.unit.unitNumber} {invoice.unit.floor ? `(Floor ${invoice.unit.floor})` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Phone: {invoice.tenant.phone}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Landlord / Owner
              </span>
              <h3 className="font-bold text-slate-800 text-base">{invoice.landlord.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{invoice.landlord.email}</p>
              {invoice.landlord.panNumber && (
                <p className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                  Landlord PAN: <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{invoice.landlord.panNumber}</span>
                </p>
              )}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Due Date: <strong>{dueDateFormatted}</strong></span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-6 sm:p-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Itemized Charges</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-medium text-slate-800">{item.description}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
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
                <div>Total Billed Amount: <strong className="text-slate-800">₹{invoice.totalAmount.toLocaleString('en-IN')}</strong></div>
                <div>Total Amount Paid: <strong className="text-emerald-700">₹{invoice.paidAmount.toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Remaining Outstanding Balance
                </span>
                <span className={`text-2xl font-black block ${invoice.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{invoice.remainingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive UPI Payment Section (Shown if Balance > 0) */}
          {invoice.remainingBalance > 0 ? (
            <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-50/60 to-white border-t border-slate-200 print:hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pay Instantly with UPI</h3>
                  <p className="text-xs text-slate-500">Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    width={200}
                    height={200}
                    className="rounded-xl border border-slate-100 shadow-inner"
                  />
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Verification & Receipt</span>
                  </div>
                </div>

                {/* Direct Action & UPI ID Copy */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Landlord UPI ID
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-slate-800 break-all">
                        {invoice.landlord.upiId}
                      </span>
                      <button
                        onClick={handleCopyUpi}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 transition flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <a
                    href={upiIntent}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-center"
                  >
                    <Smartphone className="w-4 h-4" />
                    Open UPI App on Mobile
                  </a>

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    After making payment, your landlord will confirm the receipt and this page will update automatically to <strong>PAID IN FULL</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-emerald-50/50 border-t border-emerald-100 text-center print:border-none">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Thank You! Payment Received</h3>
              <p className="text-xs text-emerald-700 mt-1">
                This invoice has been settled in full. Keep this document as your verified rent receipt for tax (HRA) declaration.
              </p>
            </div>
          )}

          {/* Payment Receipts History (if any) */}
          {invoice.payments.length > 0 && (
            <div className="p-6 sm:p-8 border-t border-slate-200/80 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Payment History & Receipts
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Receipt Date</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4">Reference ID</th>
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
                          {p.transactionReference || 'N/A'}
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
            Generated securely by RentFlow Collection Platform • All transactions recorded with cryptographic integrity.
          </div>
        </div>
      </div>
    </div>
  );
}
