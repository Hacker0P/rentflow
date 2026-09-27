'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Filter,
  IndianRupee,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  transactionReference?: string;
  notes?: string;
  invoice: {
    id: string;
    billingMonth: string;
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
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<PaymentRecord[]>('/payments');
      setPayments(res.data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.invoice.lease.tenant.name.toLowerCase().includes(term) ||
      p.invoice.lease.unit.unitNumber.toLowerCase().includes(term) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(term)) ||
      p.paymentMethod.toLowerCase().includes(term);

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalCollected = filteredPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  const exportCsv = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      'Payment ID',
      'Date',
      'Tenant Name',
      'Tenant Phone',
      'Property',
      'Unit',
      'Billing Month',
      'Payment Method',
      'Transaction Ref / UTR',
      'Amount (INR)',
      'Status',
      'Notes',
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.id}"`,
      `"${new Date(p.paymentDate).toLocaleDateString('en-IN')}"`,
      `"${p.invoice.lease.tenant.name.replace(/"/g, '""')}"`,
      `"${p.invoice.lease.tenant.phone || ''}"`,
      `"${p.invoice.lease.unit.property.name.replace(/"/g, '""')}"`,
      `"${p.invoice.lease.unit.unitNumber}"`,
      `"${new Date(p.invoice.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}"`,
      `"${p.paymentMethod}"`,
      `"${p.transactionReference || ''}"`,
      Number(p.amount).toFixed(2),
      `"${p.status || 'CONFIRMED'}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `RentFlow-Payment-Ledger-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paymentMethods = ['ALL', 'UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Financial Payment Ledger</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified reconciliation log of all tenant rent payments. Export to Excel or CSV for taxes.
          </p>
        </div>
        <Button
          onClick={exportCsv}
          disabled={filteredPayments.length === 0}
          leftIcon={<Download className="w-4 h-4" />}
          variant="outline"
          size="md"
        >
          Export CSV / Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-emerald-200/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Total Collected (Filtered)
              </span>
              <div className="text-2xl font-bold text-emerald-700 tracking-tight font-mono tabular-nums mt-1">
                ₹{totalCollected.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Settled Transactions
              </span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {filteredPayments.length} <span className="text-xs font-normal text-slate-400">payments</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {paymentMethods.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                methodFilter === m
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {m === 'ALL'
                ? 'All Channels'
                : m === 'BANK_TRANSFER'
                ? 'Bank / IMPS'
                : m}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenant, unit, UTR ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading financial ledger...</p>
          </div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records found"
          description={
            searchTerm || methodFilter !== 'ALL'
              ? 'No transactions match the selected filters.'
              : 'When tenants settle rent or you record a payment, entries will appear here.'
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Tenant & Unit</th>
                      <th className="py-3 px-4">Channel / Method</th>
                      <th className="py-3 px-4">Reference / UTR</th>
                      <th className="py-3 px-4">Billing Month</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {p.invoice.lease.tenant.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Unit {p.invoice.lease.unit.unitNumber} ({p.invoice.lease.unit.property.name})
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 max-w-[150px] truncate" title={p.transactionReference}>
                          {p.transactionReference || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {p.invoice.billingMonth}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono tabular-nums">
                          +₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Badge variant="success" size="sm" dot>
                            Confirmed
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredPayments.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">
                        {p.invoice.lease.tenant.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Unit {p.invoice.lease.unit.unitNumber} • {p.invoice.lease.unit.property.name}
                      </span>
                    </div>
                    <span className="font-bold text-sm text-emerald-600 font-mono tabular-nums">
                      +₹{Number(p.amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Channel</span>
                      <span className="text-slate-800 font-medium">{p.paymentMethod}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
                      <span className="text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  {p.transactionReference && (
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      Ref: {p.transactionReference}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
