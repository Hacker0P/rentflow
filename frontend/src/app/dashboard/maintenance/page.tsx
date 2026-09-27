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
  PlusCircle,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Check,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Create Ticket Modal State (Landlord side)
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
      // Fetch units for each property
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
          title: newTitle,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
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
      setDeleteError(err.message || 'Failed to delete maintenance ticket');
    } finally {
      setDeletingTicket(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    const urgent = tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'RESOLVED').length;
    return { total, open, inProgress, resolved, urgent };
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesTenant = t.tenant.name.toLowerCase().includes(q);
        const matchesPhone = t.tenant.phone.includes(q);
        const matchesUnit = t.unit.unitNumber.toLowerCase().includes(q);
        const matchesProp = t.unit.property.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTenant && !matchesPhone && !matchesUnit && !matchesProp) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'PLUMBING':
        return {
          icon: <Droplet className="w-4 h-4 text-sky-500" />,
          bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
          label: 'Plumbing',
        };
      case 'ELECTRICAL':
        return {
          icon: <Zap className="w-4 h-4 text-amber-500" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          label: 'Electrical',
        };
      case 'APPLIANCE':
        return {
          icon: <Tv className="w-4 h-4 text-purple-500" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          label: 'Appliance',
        };
      case 'CARPENTRY':
        return {
          icon: <Hammer className="w-4 h-4 text-amber-700" />,
          bg: 'bg-orange-50 text-orange-800 border-orange-200/80',
          label: 'Carpentry',
        };
      case 'PAINTING':
        return {
          icon: <Paintbrush className="w-4 h-4 text-emerald-500" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          label: 'Painting',
        };
      default:
        return {
          icon: <HelpCircle className="w-4 h-4 text-slate-500" />,
          bg: 'bg-slate-50 text-slate-700 border-slate-200/80',
          label: 'General / Other',
        };
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

  const getRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateStr);
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Maintenance & Repairs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track repair tickets raised by tenants, assign technicians, and coordinate work seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets()}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Maintenance Request</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Open */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Open / New</span>
            <span className="text-xl font-black text-amber-700 mt-0.5 block">{stats.open}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider block">In Progress</span>
            <span className="text-xl font-black text-sky-700 mt-0.5 block">{stats.inProgress}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Resolved</span>
            <span className="text-xl font-black text-emerald-700 mt-0.5 block">{stats.resolved}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Urgent */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Urgent Unresolved</span>
            <span className="text-xl font-black text-rose-700 mt-0.5 block">{stats.urgent}</span>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stats.urgent > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-rose-50 text-rose-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by issue title, tenant, unit number, or property..."
              className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Categories</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="APPLIANCE">Appliance</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="PAINTING">Painting</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Only</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Tickets', count: stats.total },
            { id: 'OPEN', label: 'Open', count: stats.open },
            { id: 'IN_PROGRESS', label: 'In Progress', count: stats.inProgress },
            { id: 'RESOLVED', label: 'Resolved', count: stats.resolved },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No maintenance tickets found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tickets match your active filter criteria. Try clearing filters or changing search terms.'
              : 'When tenants submit repair tickets or when you log a request, they will appear here.'}
          </p>
          {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTickets.map((t) => {
            const cat = getCategoryDetails(t.category);
            const isUrgent = t.priority === 'URGENT';
            const isResolved = t.status === 'RESOLVED';
            const isInProgress = t.status === 'IN_PROGRESS';
            const isOpen = t.status === 'OPEN';

            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-4 overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category, Priority, and Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category Pill */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${cat.bg}`}>
                        {cat.icon}
                        <span>{cat.label}</span>
                      </span>

                      {/* Priority Pill */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl shrink-0 inline-flex items-center gap-1 ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold'
                            : t.priority === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />}
                        <span>{t.priority}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {getRelativeTime(t.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setTicketToDelete(t);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Unit info */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug">{t.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">Unit {t.unit.unitNumber}</span>
                      <span>•</span>
                      <span className="truncate">{t.unit.property.name}</span>
                    </div>
                  </div>

                  {/* Issue Description */}
                  <p className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 leading-relaxed break-words">
                    {t.description}
                  </p>

                  {/* Visual Status Progress Stepper */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5 px-1">
                      <span className={isOpen ? 'text-amber-700 font-bold' : isResolved || isInProgress ? 'text-slate-800' : ''}>
                        1. Reported
                      </span>
                      <span className={isInProgress ? 'text-sky-700 font-bold' : isResolved ? 'text-slate-800' : ''}>
                        2. In Progress
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

                  {/* Tenant Details & Quick Actions */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                        {t.tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block leading-tight">{t.tenant.name}</span>
                        <span className="text-[11px] text-slate-400">{t.tenant.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${t.tenant.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
                        title="Call Tenant"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${t.tenant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${t.tenant.name}, regarding your maintenance request "${t.title}" for Unit ${t.unit.unitNumber} at ${t.unit.property.name}: `
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition active:scale-95"
                        title="WhatsApp Tenant"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Status Transition Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                    {t.resolvedAt && (
                      <span className="text-[10px] text-slate-400">
                        Closed on {formatDate(t.resolvedAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* If Open: can advance to In Progress */}
                    {isOpen && (
                      <button
                        onClick={() => handleStatusUpdate(t.id, 'IN_PROGRESS')}
                        disabled={updatingId === t.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                      >
                        {updatingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                        <span>Start Work</span>
                      </button>
                    )}

                    {/* If not Resolved: can mark Resolved */}
                    {!isResolved && (
                      <button
                        onClick={() => handleStatusUpdate(t.id, 'RESOLVED')}
                        disabled={updatingId === t.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        {updatingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Mark Resolved</span>
                      </button>
                    )}

                    {/* If Resolved: option to Reopen */}
                    {isResolved && (
                      <button
                        onClick={() => handleStatusUpdate(t.id, 'OPEN')}
                        disabled={updatingId === t.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
                        title="Reopen issue"
                      >
                        {updatingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Maintenance Request Modal (Landlord) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Log Maintenance Request</h3>
                  <p className="text-xs text-slate-400">Record a repair issue for a property & unit</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Property & Unit Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Property</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => handlePropertySelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                    required
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Unit / Flat</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                    required
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

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master bedroom AC compressor leaking water"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="PLUMBING">Plumbing (Water/Tap)</option>
                    <option value="ELECTRICAL">Electrical (Lights/Fan/Switch)</option>
                    <option value="APPLIANCE">Appliance (AC/Geyser/Fridge)</option>
                    <option value="CARPENTRY">Carpentry (Door/Lock/Window)</option>
                    <option value="PAINTING">Painting / Wall Plaster</option>
                    <option value="OTHER">Other Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="LOW">Low (Routine maintenance)</option>
                    <option value="MEDIUM">Medium (Standard repair)</option>
                    <option value="URGENT">Urgent (Immediate attention)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail the issue symptoms, technician scheduled date, or tenant report..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {creatingTicket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creatingTicket ? 'Logging...' : 'Save Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Ticket</h3>
                <p className="text-xs text-slate-500">Remove maintenance record</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">&quot;{ticketToDelete.title}&quot;</span> for Unit {ticketToDelete.unit.unitNumber}? This record will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTicketToDelete(null);
                  setDeleteError(null);
                }}
                disabled={deletingTicket}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTicket}
                disabled={deletingTicket}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {deletingTicket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingTicket ? 'Deleting...' : 'Delete Ticket'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
