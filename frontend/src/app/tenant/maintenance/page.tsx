'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Wrench,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Droplet,
  Zap,
  Hammer,
  Paintbrush,
  Tv,
  HelpCircle,
  X,
  Phone,
  MessageCircle,
  Building2,
  Radio,
  Trash2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  unit: {
    unitNumber: string;
    property: {
      name: string;
      owner?: {
        name: string;
        phone?: string | null;
      };
    };
  };
}

export default function TenantMaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Withdraw/Cancel ticket modal
  const [ticketToCancel, setTicketToCancel] = useState<MaintenanceTicket | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<MaintenanceTicket[]>('/maintenance');
      setTickets(res.data);
    } catch (err: any) {
      console.error('Failed to load maintenance tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          priority,
          description,
        }),
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      setCategory('PLUMBING');
      setPriority('MEDIUM');
      await fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to submit maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticketToCancel) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await apiRequest(`/maintenance/${ticketToCancel.id}`, {
        method: 'DELETE',
      });
      setTicketToCancel(null);
      await fetchTickets();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    return { total, active, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ACTIVE') {
      return tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    }
    if (statusFilter === 'RESOLVED') {
      return tickets.filter((t) => t.status === 'RESOLVED');
    }
    return tickets;
  }, [tickets, statusFilter]);

  const categories = [
    { id: 'PLUMBING', label: 'Plumbing', icon: Droplet, color: 'text-sky-500' },
    { id: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: 'text-amber-500' },
    { id: 'APPLIANCE', label: 'Appliance', icon: Tv, color: 'text-purple-500' },
    { id: 'CARPENTRY', label: 'Carpentry', icon: Hammer, color: 'text-orange-700' },
    { id: 'PAINTING', label: 'Painting', icon: Paintbrush, color: 'text-emerald-500' },
    { id: 'OTHER', label: 'Other', icon: HelpCircle, color: 'text-slate-500' },
  ];

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'PLUMBING':
        return { icon: <Droplet className="w-4 h-4 text-sky-500" />, bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'ELECTRICAL':
        return { icon: <Zap className="w-4 h-4 text-amber-500" />, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'APPLIANCE':
        return { icon: <Tv className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'CARPENTRY':
        return { icon: <Hammer className="w-4 h-4 text-orange-700" />, bg: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'PAINTING':
        return { icon: <Paintbrush className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { icon: <HelpCircle className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Flat Care & Repairs
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Maintenance & Repairs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Report issues to your landlord and track technician visits in real-time.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise Repair Request</span>
        </button>
      </div>

      {/* KPI Overview and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          {[
            { id: 'ALL' as const, label: 'All Requests', count: stats.total },
            { id: 'ACTIVE' as const, label: 'Active / In Progress', count: stats.active },
            { id: 'RESOLVED' as const, label: 'Resolved', count: stats.resolved },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No Maintenance Requests Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter !== 'ALL'
              ? 'No tickets match the selected status filter.'
              : 'Everything looks good! If you ever need something fixed in your flat, tap "Raise Repair Request" above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const cat = getCategoryDetails(t.category);
            const isResolved = t.status === 'RESOLVED';
            const isInProgress = t.status === 'IN_PROGRESS';
            const isOpen = t.status === 'OPEN';
            const isUrgent = t.priority === 'URGENT';
            const landlord = t.unit.property.owner;

            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4 hover:border-slate-300 transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {cat.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{t.title}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xl border ${
                            isUrgent
                              ? 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold'
                              : t.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        Unit {t.unit.unitNumber} • {t.unit.property.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Status Pill */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isInProgress ? (
                        <Radio className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{t.status.replace('_', ' ')}</span>
                    </span>

                    {/* Withdraw button for Open tickets */}
                    {isOpen && (
                      <button
                        onClick={() => {
                          setCancelError(null);
                          setTicketToCancel(t);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
                        title="Cancel this request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 leading-relaxed break-words">
                  {t.description}
                </p>

                {/* Visual Progress Stepper */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                    <span className={isOpen ? 'text-amber-700 font-bold' : isResolved || isInProgress ? 'text-slate-800' : ''}>
                      1. Reported
                    </span>
                    <span className={isInProgress ? 'text-sky-700 font-bold' : isResolved ? 'text-slate-800' : ''}>
                      2. Under Review / In Progress
                    </span>
                    <span className={isResolved ? 'text-emerald-700 font-bold' : ''}>
                      3. Resolved
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className={`h-1.5 rounded-full ${isOpen || isInProgress || isResolved ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full ${isInProgress || isResolved ? 'bg-sky-500' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                </div>

                {/* Footer with dates and landlord contact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>Submitted on {formatDate(t.createdAt)}</span>
                    {t.resolvedAt && (
                      <span className="text-emerald-600 font-bold ml-2">
                        • Resolved on {formatDate(t.resolvedAt)}
                      </span>
                    )}
                  </div>

                  {landlord && landlord.phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${landlord.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${landlord.name || 'Landlord'}, regarding my maintenance request "${t.title}" for Unit ${t.unit.unitNumber}: `
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Landlord</span>
                      </a>
                      <a
                        href={`tel:${landlord.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Raise Maintenance Request</h3>
                  <p className="text-xs text-slate-400">Your landlord will be notified instantly</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Visual Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">What needs repair?</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((c) => {
                    const Icon = c.icon;
                    const isSelected = category === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs font-bold'
                            : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : c.color}`} />
                        <span className="text-[11px] truncate w-full">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bathroom tap leaking water continuously"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Urgency Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'LOW', label: 'Low', desc: 'Can wait a few days' },
                    { id: 'MEDIUM', label: 'Medium', desc: 'Normal attention' },
                    { id: 'URGENT', label: 'Urgent', desc: 'Needs fast repair' },
                  ].map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPriority(p.id)}
                        className={`p-2 rounded-xl border text-left transition ${
                          isSelected
                            ? p.id === 'URGENT'
                              ? 'bg-rose-50 border-rose-600 text-rose-900 font-bold'
                              : 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe when the issue began, exact location in the flat, or special instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Submitting...' : 'Send Request to Landlord'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {ticketToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cancel Repair Request</h3>
                <p className="text-xs text-slate-500">Withdraw this ticket</p>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cancelError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel <span className="font-bold text-slate-900">&quot;{ticketToCancel.title}&quot;</span>? This will remove the request from your landlord&apos;s queue.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTicketToCancel(null);
                  setCancelError(null);
                }}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleCancelTicket}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{cancelling ? 'Cancelling...' : 'Yes, Cancel Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
