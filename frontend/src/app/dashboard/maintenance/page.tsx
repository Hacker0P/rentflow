'use client';

import { useEffect, useState } from 'react';
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
  resolvedAt?: string;
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
}

export default function LandlordMaintenancePage() {
  const [tickets, setTickets] = useState<LandlordMaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await apiRequest(`/maintenance/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'PLUMBING':
        return <Droplet className="w-4 h-4 text-blue-500" />;
      case 'ELECTRICAL':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'APPLIANCE':
        return <Tv className="w-4 h-4 text-purple-500" />;
      case 'CARPENTRY':
        return <Hammer className="w-4 h-4 text-amber-700" />;
      case 'PAINTING':
        return <Paintbrush className="w-4 h-4 text-emerald-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance & Repairs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track repair tickets raised by tenants, coordinate technicians, and close issues.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No maintenance tickets found</h3>
          <p className="text-xs text-slate-400 mt-1">Tenant repair requests will automatically appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                      {getCategoryIcon(t.category)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{t.title}</h4>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {t.unit.unitNumber} • {t.unit.property.name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      t.priority === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : t.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {t.description}
                </p>

                {/* Tenant Info & Quick Action */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div>
                    <span className="font-semibold text-slate-800 block">{t.tenant.name}</span>
                    <span className="text-[11px] text-slate-400">{t.tenant.phone}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${t.tenant.phone}`}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Call Tenant"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${t.tenant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${t.tenant.name}, regarding your maintenance request "${t.title}": `
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                      title="WhatsApp Tenant"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    t.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {t.status.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-1.5">
                  {t.status !== 'IN_PROGRESS' && t.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusUpdate(t.id, 'IN_PROGRESS')}
                      disabled={updatingId === t.id}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                    >
                      Assign / In Progress
                    </button>
                  )}

                  {t.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusUpdate(t.id, 'RESOLVED')}
                      disabled={updatingId === t.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
