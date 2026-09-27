'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Download,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Filter,
  IndianRupee,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Payment Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation ledger of all tenant payments. Export to Excel/CSV for income tax or CA audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={filteredPayments.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-300 hover:border-slate-400 active:scale-95 text-xs font-bold text-slate-700 shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Ledger (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Received
              </span>
              <span className="text-2xl font-black text-slate-900">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100/70 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Filtered Entries
              </span>
              <span className="text-2xl font-black text-slate-900">
                {filteredPayments.length} <span className="text-xs font-normal text-slate-400">payments</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100/70 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Avg. Ticket Size
              </span>
              <span className="text-2xl font-black text-slate-900">
                ₹
                {filteredPayments.length > 0
                  ? Math.round(totalCollected / filteredPayments.length).toLocaleString('en-IN')
                  : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Method Pill Selector */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Method:
          </span>
          {paymentMethods.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                methodFilter === m
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-100'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tenant, unit, UTR..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No payment records found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm || methodFilter !== 'ALL'
              ? 'Try clearing your filters or search query.'
              : 'Payments will appear here when recorded or reported by tenants.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* 1. Mobile App Card View (< lg screens) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredPayments.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5 hover:bg-slate-50/60 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block">
                      {p.invoice.lease.tenant.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Unit {p.invoice.lease.unit.unitNumber} • {p.invoice.lease.unit.property.name}
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    +₹{Number(p.amount).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {p.paymentMethod.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {p.transactionReference && (
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200">
                      UTR: {p.transactionReference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 2. Desktop Table View (>= lg screens) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-5">Receipt Date</th>
                  <th className="py-4 px-5">Tenant / Unit</th>
                  <th className="py-4 px-5">Billing Period</th>
                  <th className="py-4 px-5">Method</th>
                  <th className="py-4 px-5">Transaction / UTR</th>
                  <th className="py-4 px-5">Notes</th>
                  <th className="py-4 px-5 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const methodColors: Record<string, string> = {
                    UPI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    BANK_TRANSFER: 'bg-blue-50 text-blue-700 border-blue-200',
                    CASH: 'bg-amber-50 text-amber-700 border-amber-200',
                    CHEQUE: 'bg-purple-50 text-purple-700 border-purple-200',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-medium text-slate-700">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 block text-xs">
                          {p.invoice.lease.tenant.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Unit {p.invoice.lease.unit.unitNumber} • {p.invoice.lease.unit.property.name}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-medium">
                        {new Date(p.invoice.billingMonth).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            methodColors[p.paymentMethod] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-slate-700 font-semibold">
                        {p.transactionReference ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {p.transactionReference}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-[11px] max-w-xs truncate">
                        {p.notes || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-4 px-5 text-right font-black text-emerald-700 text-sm">
                        +₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
