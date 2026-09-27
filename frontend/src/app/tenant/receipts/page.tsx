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
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function TenantReceiptsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

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
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Fetching payment records...</p>
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

  // Calculate totals
  const totalPaidRent = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
  const fullyPaidCount = invoices.filter((inv: any) => inv.isFullyPaid).length;
  const pendingCount = invoices.filter((inv: any) => !inv.isFullyPaid).length;
  const totalPendingAmount = invoices
    .filter((inv: any) => !inv.isFullyPaid)
    .reduce((acc: number, inv: any) => acc + (inv.remainingBalance || 0), 0);

  const filteredInvoices = invoices.filter((inv: any) => {
    if (filter === 'PAID') return inv.isFullyPaid;
    if (filter === 'PENDING') return !inv.isFullyPaid;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payment Receipts & HRA</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Official rent receipts with landlord PAN for company income tax and HRA exemption claims.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-semibold block">Total Rent Paid</span>
              <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
                ₹{totalPaidRent.toLocaleString('en-IN')}
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
              <span className="text-xs text-slate-500 font-semibold block">Verified Receipts</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {fullyPaidCount} <span className="text-xs font-normal text-slate-400">receipts</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-800 font-semibold block">Pending Balance</span>
              <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">
                ₹{totalPendingAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { key: 'ALL', label: 'All Records', count: invoices.length },
          { key: 'PAID', label: 'Verified Paid', count: fullyPaidCount },
          { key: 'PENDING', label: 'Pending Dues', count: pendingCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
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

      {/* Receipts Content */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No receipts found"
          description="Once your rent payments are settled and confirmed by your landlord, official downloadable receipts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv: any) => {
            const isPaid = inv.isFullyPaid || inv.status === 'PAID';

            return (
              <Card key={inv.id} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {inv.billingMonth} Rent Receipt
                      </span>
                      <Badge
                        variant={isPaid ? 'success' : inv.status === 'OVERDUE' ? 'error' : 'warning'}
                        size="sm"
                        dot
                      >
                        {isPaid ? 'Paid' : inv.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                      Unit {unit?.unitNumber} • {property?.name} • Due {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {inv.payments && inv.payments.length > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Paid via {inv.payments[0].paymentMethod} {inv.payments[0].transactionReference ? `(Ref: ${inv.payments[0].transactionReference})` : ''} on {new Date(inv.payments[0].paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-lg font-bold text-slate-900 font-mono tabular-nums block">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </span>
                      {isPaid ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 sm:justify-end">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold block">
                          Bal: ₹{Number(inv.remainingBalance).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant={isPaid ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedReceipt(inv)}
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                      >
                        {isPaid ? 'View Receipt' : 'View Bill'}
                      </Button>

                      <Link href={`/pay/${inv.id}`} target="_blank">
                        <Button variant="ghost" size="sm" title="Open Public Link">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          title="Official Rent Receipt"
          description={`Receipt for ${selectedReceipt.billingMonth}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Printable Receipt Canvas */}
            <div id="printable-receipt" className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-5 text-xs text-slate-800">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">RENT RECEIPT</h2>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Receipt ID: {selectedReceipt.id.slice(0, 16)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Billing Period: <strong className="text-slate-800">{selectedReceipt.billingMonth}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900 font-mono tabular-nums block">
                    ₹{Number(selectedReceipt.totalAmount).toLocaleString('en-IN')}
                  </span>
                  <Badge variant={selectedReceipt.isFullyPaid ? 'success' : 'warning'} size="sm" dot>
                    {selectedReceipt.isFullyPaid ? 'PAID & CONFIRMED' : 'PENDING'}
                  </Badge>
                </div>
              </div>

              {/* Landlord & Tenant Two-Column Grid */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Received By (Landlord)
                  </span>
                  <p className="font-semibold text-slate-900">{landlord?.name || 'Landlord'}</p>
                  <p className="text-slate-600">{landlord?.phone}</p>
                  {landlord?.panNumber ? (
                    <p className="text-emerald-700 font-mono font-semibold">
                      PAN: {landlord.panNumber} (Valid for HRA)
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">PAN not provided</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Paid By (Tenant)
                  </span>
                  <p className="font-semibold text-slate-900">{tenant?.name || 'Resident'}</p>
                  <p className="text-slate-600">
                    Unit {unit?.unitNumber}, {property?.name}
                  </p>
                  <p className="text-slate-500">{property?.address}</p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Payment Breakdown
                </span>
                <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200/80 p-3">
                  {selectedReceipt.items?.map((item: any) => (
                    <div key={item.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <span className="text-slate-700">{item.description}</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              {selectedReceipt.payments && selectedReceipt.payments.length > 0 && (
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Settlement Details
                  </span>
                  <p className="text-slate-700">
                    Settled on {new Date(selectedReceipt.payments[0].paymentDate).toLocaleDateString('en-IN')} via {selectedReceipt.payments[0].paymentMethod}
                  </p>
                  {selectedReceipt.payments[0].transactionReference && (
                    <p className="text-slate-600 font-mono">
                      Ref / UTR: {selectedReceipt.payments[0].transactionReference}
                    </p>
                  )}
                </div>
              )}

              {/* Signature Stamp */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Electronically verified via RentFlow</span>
                <span className="font-mono">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
