'use client';

import { useEffect, useState } from 'react';
import {
  Wrench,
  Plus,
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
  Trash2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

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
          title: title.trim(),
          category,
          priority,
          description: description.trim(),
        }),
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      await fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to submit repair request');
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
      setCancelError(err.message || 'Failed to cancel ticket');
    } finally {
      setCancelling(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'PLUMBING':
        return <Droplet className="w-4 h-4 text-sky-600" />;
      case 'ELECTRICAL':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'APPLIANCE':
        return <Tv className="w-4 h-4 text-purple-600" />;
      case 'CARPENTRY':
        return <Hammer className="w-4 h-4 text-amber-700" />;
      case 'PAINTING':
        return <Paintbrush className="w-4 h-4 text-emerald-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'HIGH':
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'RESOLVED':
        return <Badge variant="success" size="sm" dot>Resolved</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="brand" size="sm" dot>In Progress</Badge>;
      default:
        return <Badge variant="warning" size="sm" dot>Under Review</Badge>;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ACTIVE') return t.status !== 'RESOLVED';
    if (statusFilter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Repairs & Maintenance</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log maintenance issues, request technician visits, and track repairs.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="primary"
          size="md"
        >
          Report Issue
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { key: 'ALL', label: 'All Requests' },
          { key: 'ACTIVE', label: 'In Progress' },
          { key: 'RESOLVED', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading repair requests...</p>
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance requests"
          description="Everything in your flat is operating normally! If anything breaks or needs repair, click Report Issue to notify your landlord."
          action={{
            label: 'Report Issue',
            onClick: () => setShowModal(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/80">
                      {getCategoryIcon(ticket.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                        {ticket.category}
                      </span>
                      <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                        {ticket.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                  {ticket.description || 'No detailed remarks provided.'}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                  <span>
                    Reported on {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>

                  {ticket.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setTicketToCancel(ticket)}
                      className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Withdraw Request
                    </button>
                  )}

                  {ticket.status === 'RESOLVED' && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Resolved
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal 1: Report Issue */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Report Maintenance Issue"
        description="Notify your landlord to schedule an inspection or repair technician."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Issue Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kitchen tap leaking, AC not cooling, Geyser switch broken"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                <option value="PLUMBING">Plumbing & Water</option>
                <option value="ELECTRICAL">Electrical & Lighting</option>
                <option value="APPLIANCE">Appliance / AC / Geyser</option>
                <option value="CARPENTRY">Carpentry & Locks</option>
                <option value="PAINTING">Painting & Seepage</option>
                <option value="OTHER">General Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Urgency Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                <option value="HIGH">High (Urgent Attention)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="LOW">Low (Can wait)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Provide symptoms, convenient visit timings, or details to help the technician..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Cancel/Withdraw Ticket */}
      <Modal
        isOpen={!!ticketToCancel}
        onClose={() => setTicketToCancel(null)}
        title="Withdraw Request"
        description="Are you sure you want to cancel this maintenance request?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will remove <strong className="text-slate-900">&ldquo;{ticketToCancel?.title}&rdquo;</strong> from your landlord&apos;s desk.
          </p>

          {cancelError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setTicketToCancel(null)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={cancelling}
              onClick={handleCancelTicket}
            >
              Withdraw Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
