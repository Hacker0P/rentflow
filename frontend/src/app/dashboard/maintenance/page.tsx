'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Droplet,
  Zap,
  Tv,
  Hammer,
  Paintbrush,
  HelpCircle,
  Phone,
  MessageCircle,
  Building2,
  User,
  Filter,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

interface LandlordMaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  tenant: {
    id?: string;
    name: string;
    phone: string;
  };
  unit: {
    id: string;
    unitNumber: string;
    property: {
      id: string;
      name: string;
    };
  };
}

interface PropertyOption {
  id: string;
  name: string;
  units: {
    id: string;
    unitNumber: string;
  }[];
}

export default function LandlordMaintenancePage() {
  const [tickets, setTickets] = useState<LandlordMaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('PLUMBING');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Ticket Modal State
  const [ticketToDelete, setTicketToDelete] = useState<LandlordMaintenanceTicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<LandlordMaintenanceTicket[]>('/maintenance');
      setTickets(res.data);
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertiesForCreate = async () => {
    try {
      const res = await apiRequest<any[]>('/properties');
      const propData = res.data;
      const fullProps: PropertyOption[] = [];
      for (const p of propData) {
        try {
          const uRes = await apiRequest<any[]>(`/properties/${p.id}/units`);
          fullProps.push({
            id: p.id,
            name: p.name,
            units: uRes.data.map((u: any) => ({ id: u.id, unitNumber: u.unitNumber })),
          });
        } catch {
          fullProps.push({ id: p.id, name: p.name, units: [] });
        }
      }
      setProperties(fullProps);
      if (fullProps.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(fullProps[0].id);
        if (fullProps[0].units.length > 0) {
          setSelectedUnitId(fullProps[0].units[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch properties for maintenance creation:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchPropertiesForCreate();
  }, []);

  const handlePropertySelect = (propId: string) => {
    setSelectedPropertyId(propId);
    const found = properties.find((p) => p.id === propId);
    if (found && found.units.length > 0) {
      setSelectedUnitId(found.units[0].id);
    } else {
      setSelectedUnitId('');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await apiRequest(`/maintenance/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setCreateError('Please select a unit to raise this repair ticket for.');
      return;
    }

    try {
      setCreatingTicket(true);
      setCreateError(null);

      await apiRequest('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          unitId: selectedUnitId,
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority,
          description: newDescription.trim(),
        }),
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      await fetchTickets();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create maintenance ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      setDeleteError(null);

      await apiRequest(`/maintenance/${ticketToDelete.id}`, {
        method: 'DELETE',
      });

      setTicketToDelete(null);
      await fetchTickets();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete ticket');
    } finally {
      setDeletingTicket(false);
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
        return <Badge variant="warning" size="sm" dot>Pending Review</Badge>;
    }
  };

  // Metrics
  const pendingCount = tickets.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchTenant = t.tenant?.name?.toLowerCase().includes(q);
      const matchUnit = t.unit?.unitNumber?.toLowerCase().includes(q);
      const matchProp = t.unit?.property?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTenant && !matchUnit && !matchProp) {
        return false;
      }
    }

    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Maintenance Desk</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track repair tickets reported by tenants, assign technicians, and mark issues resolved.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="primary"
          size="md"
        >
          Log Repair Ticket
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={pendingCount > 0 ? 'border-amber-200/80' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
                Pending Review
              </span>
              <div className="text-2xl font-bold text-amber-700 tracking-tight mt-1">
                {pendingCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={inProgressCount > 0 ? 'border-blue-200/80' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
                In Progress
              </span>
              <div className="text-2xl font-bold text-blue-600 tracking-tight mt-1">
                {inProgressCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Resolved
              </span>
              <div className="text-2xl font-bold text-emerald-600 tracking-tight mt-1">
                {resolvedCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'RESOLVED', label: 'Resolved' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
                statusFilter === s.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, units, issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading repair tickets...</p>
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance tickets found"
          description="Everything is running smoothly! When tenants log repair requests or you create one, they will appear here."
          action={{
            label: 'Log New Ticket',
            onClick: () => setShowCreateModal(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/80">
                      {getCategoryIcon(ticket.category)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {ticket.category}
                      </span>
                      <h3 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setTicketToDelete(ticket);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
                  {ticket.description || 'No detailed remarks provided.'}
                </p>

                {/* Property & Tenant Meta */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Location:</span>
                    <span className="font-medium text-slate-800">
                      Unit {ticket.unit?.unitNumber} ({ticket.unit?.property?.name})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Reported By:</span>
                    <span className="font-medium text-slate-800">
                      {ticket.tenant?.name || 'Landlord entry'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Logged on:</span>
                    <span className="text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Status & Priority Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>

                {/* Actions Bar */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  {ticket.tenant?.phone && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/91${ticket.tenant.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Message Tenant on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${ticket.tenant.phone}`}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Call Tenant"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Status Progression Buttons */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {ticket.status === 'PENDING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={updatingId === ticket.id}
                        onClick={() => handleStatusUpdate(ticket.id, 'IN_PROGRESS')}
                      >
                        Start Work
                      </Button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={updatingId === ticket.id}
                        onClick={() => handleStatusUpdate(ticket.id, 'RESOLVED')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Resolve
                      </Button>
                    )}
                    {ticket.status === 'RESOLVED' && (
                      <button
                        type="button"
                        disabled={updatingId === ticket.id}
                        onClick={() => handleStatusUpdate(ticket.id, 'IN_PROGRESS')}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline transition-colors"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal 1: Log Repair Ticket */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Log Maintenance Ticket"
        description="Register an inspection, repair, or renovation request for a unit."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Property *
              </label>
              <select
                required
                value={selectedPropertyId}
                onChange={(e) => handlePropertySelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Unit *
              </label>
              <select
                required
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                {properties
                  .find((p) => p.id === selectedPropertyId)
                  ?.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Issue Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Geyser leakage in master bathroom, Main switch tripping"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                <option value="PLUMBING">Plumbing & Water</option>
                <option value="ELECTRICAL">Electrical & Wiring</option>
                <option value="APPLIANCE">Appliance / AC</option>
                <option value="CARPENTRY">Carpentry & Doors</option>
                <option value="PAINTING">Painting & Walls</option>
                <option value="OTHER">General Repair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Priority *
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                <option value="HIGH">High Priority (Urgent)</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority (Routine)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Detailed Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, technician instructions, or vendor quotes..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={creatingTicket}
            >
              Log Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Delete Ticket Confirmation */}
      <Modal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        title="Delete Ticket"
        description="Are you sure you want to delete this repair ticket?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will permanently remove ticket <strong className="text-slate-900">&ldquo;{ticketToDelete?.title}&rdquo;</strong> from your history.
          </p>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setTicketToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={deletingTicket}
              onClick={handleDeleteTicket}
            >
              Delete Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
