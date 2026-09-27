'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  MessageCircle,
  Users,
  CreditCard,
  Send,
  Phone,
  ArrowRight,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { apiRequest, getStoredUser } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WhatsAppModal, WhatsAppReminderData } from '@/components/whatsapp-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

interface DashboardData {
  stats: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
  };
  financials: {
    expectedCollection: number;
    collectedAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  recentPayments: Array<{
    id: string;
    invoiceId?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference?: string;
    tenantName: string;
    tenantPhone?: string;
    unitNumber: string;
    propertyName: string;
    billingMonth?: string;
  }>;
  upcomingInvoices: Array<{
    id: string;
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    dueDate: string;
    status: string;
    tenantName: string;
    tenantPhone: string;
    unitNumber: string;
    propertyName: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [whatsAppModalData, setWhatsAppModalData] = useState<WhatsAppReminderData | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<DashboardData>('/dashboard/summary');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    fetchDashboardData();
  }, []);

  const handleGenerateInvoices = async () => {
    try {
      setGenerating(true);
      setGenerateMsg(null);
      const res = await apiRequest<any>('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setGenerateMsg(`Generated ${res.data.generatedCount} invoice(s), ${res.data.skippedCount} already billed.`);
      await fetchDashboardData();
    } catch (err: any) {
      setGenerateMsg(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const currentDateString = useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
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

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading portfolio overview...</p>
        </div>
      </div>
    );
  }

  const { stats, financials, recentPayments, upcomingInvoices } = data || {
    stats: { totalProperties: 0, totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, occupancyRate: 0 },
    financials: { expectedCollection: 0, collectedAmount: 0, pendingAmount: 0, overdueAmount: 0 },
    recentPayments: [],
    upcomingInvoices: [],
  };

  const collectionPct =
    financials.expectedCollection > 0
      ? Math.min(100, Math.round((financials.collectedAmount / financials.expectedCollection) * 100))
      : 0;

  const overdueInvoices = upcomingInvoices.filter((inv) => inv.status === 'OVERDUE');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Landlord'}
            </h1>
            <Badge variant="brand" size="sm">
              Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {currentDateString} • Overview for <span className="font-semibold text-slate-700">{currentMonthYear}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateInvoices}
            isLoading={generating}
            leftIcon={<Receipt className="w-4 h-4" />}
          >
            Generate Monthly Bills
          </Button>

          <Link href="/dashboard/invoices">
            <Button variant="outline" size="md" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              Invoices
            </Button>
          </Link>
        </div>
      </div>

      {generateMsg && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{generateMsg}</span>
          </div>
          <button
            onClick={() => setGenerateMsg(null)}
            className="text-blue-600 hover:text-blue-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Overdue Action Callout */}
      {financials.overdueAmount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-rose-950 leading-snug">
                Attention: ₹{financials.overdueAmount.toLocaleString('en-IN')} in Overdue Rent
              </h4>
              <p className="text-xs text-rose-800/80 mt-0.5">
                {overdueInvoices.length} invoice(s) are overdue. You can send 1-tap WhatsApp reminders directly from the list below.
              </p>
            </div>
          </div>
          <Link href="/dashboard/invoices" className="shrink-0">
            <Button variant="danger" size="sm">
              Review Overdue Bills
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Financial Performance KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rent Collections • {currentMonthYear}
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Currency: INR (₹)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Expected Rent */}
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Expected Rent</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                ₹{financials.expectedCollection.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400">Total active monthly leases</p>
            </CardContent>
          </Card>

          {/* Collected Amount */}
          <Card className="border-emerald-200/80">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Collected</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
                ₹{financials.collectedAmount.toLocaleString('en-IN')}
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${collectionPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                  <span>Collected</span>
                  <span>{collectionPct}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Due */}
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-800">Pending Due</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-700 tracking-tight tabular-nums">
                ₹{financials.pendingAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400">Within payment due window</p>
            </CardContent>
          </Card>

          {/* Overdue Rent */}
          <Card className={financials.overdueAmount > 0 ? 'border-rose-200' : ''}>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-800">Overdue Rent</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-700 tracking-tight tabular-nums">
                ₹{financials.overdueAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400">Past payment due date</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Portfolio Snapshot */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Property & Unit Occupancy
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Properties</span>
                <div className="text-lg font-bold text-slate-900">{stats.totalProperties}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Total Units</span>
                <div className="text-lg font-bold text-slate-900">{stats.totalUnits}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Occupied</span>
                <div className="text-lg font-bold text-emerald-700">{stats.occupiedUnits}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Vacant</span>
                <div className="text-lg font-bold text-amber-700">{stats.vacantUnits}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Occupancy</span>
                <div className="text-lg font-bold text-blue-600">{stats.occupancyRate}%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Feeds: Upcoming Invoices & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Invoices Feed */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Rent Invoices Due</CardTitle>
              <CardDescription>Upcoming dues with 1-tap WhatsApp reminders</CardDescription>
            </div>
            <Link
              href="/dashboard/invoices"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-4">
            {upcomingInvoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No pending invoices due in the next 14 days. All tenants are up to date!
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingInvoices.map((inv) => {
                  const isOverdue = inv.status === 'OVERDUE';

                  return (
                    <div
                      key={inv.id}
                      className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        isOverdue
                          ? 'border-rose-200/90 bg-rose-50/30 hover:bg-rose-50/60'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {inv.tenantName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            (Unit {inv.unitNumber})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          Due {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {inv.propertyName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-900 block font-mono tabular-nums">
                            ₹{inv.remainingBalance.toLocaleString('en-IN')}
                          </span>
                          <Badge
                            variant={isOverdue ? 'error' : 'warning'}
                            size="sm"
                            dot
                            className="mt-0.5"
                          >
                            {inv.status}
                          </Badge>
                        </div>

                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() =>
                            setWhatsAppModalData({
                              invoiceId: inv.id,
                              tenantName: inv.tenantName,
                              tenantPhone: inv.tenantPhone,
                              unitNumber: inv.unitNumber,
                              propertyName: inv.propertyName,
                              amount: inv.remainingBalance,
                              dueDate: inv.dueDate,
                            })
                          }
                          title="Send WhatsApp Reminder"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Quick Call */}
                        {inv.tenantPhone && (
                          <a
                            href={`tel:${inv.tenantPhone}`}
                            title="Call Tenant"
                            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Collections Feed */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Verified Collections</CardTitle>
              <CardDescription>Real-time payment receipt log</CardDescription>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="p-4">
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No payment transactions recorded yet. When tenants settle rent via UPI or cash, entries will appear here.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 text-xs block truncate">
                        {p.tenantName} ({p.unitNumber})
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} via {p.paymentMethod} • {p.propertyName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-xs text-emerald-600 block font-mono tabular-nums">
                          +₹{p.amount.toLocaleString('en-IN')}
                        </span>
                        <Badge variant="success" size="sm" className="mt-0.5">
                          Verified
                        </Badge>
                      </div>

                      {p.tenantPhone && p.invoiceId && (
                        <button
                          onClick={() =>
                            setWhatsAppModalData({
                              invoiceId: p.invoiceId!,
                              tenantName: p.tenantName,
                              tenantPhone: p.tenantPhone!,
                              unitNumber: p.unitNumber,
                              propertyName: p.propertyName,
                              amount: p.amount,
                              paidAmount: p.amount,
                              dueDate: p.paymentDate,
                              billingMonth: p.billingMonth,
                              isPaid: true,
                              paymentMethod: p.paymentMethod,
                              transactionReference: p.transactionReference,
                            })
                          }
                          title="Send WhatsApp Receipt to Tenant"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Reminder Modal */}
      <WhatsAppModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        data={whatsAppModalData}
      />
    </div>
  );
}
