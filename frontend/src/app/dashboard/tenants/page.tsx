'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Home,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Building2,
  Calendar,
  IndianRupee,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  X,
  Share2,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  leases: Array<{
    id: string;
    monthlyRent: number;
    maintenanceAmount: number;
    rentDueDay: number;
    status: string;
    startDate: string;
    unit: {
      unitNumber: string;
      property: {
        name: string;
      };
    };
  }>;
}

interface WelcomeInviteData {
  tenantName: string;
  tenantPhone: string;
  unitNumber: string;
  propertyName: string;
  monthlyRent: number;
  rentDueDay: number;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // New Lease Modal
  const [showAddLease, setShowAddLease] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number | ''>(15000);
  const [maintenanceAmount, setMaintenanceAmount] = useState<number | ''>(2000);
  const [securityDeposit, setSecurityDeposit] = useState<number | ''>(50000);
  const [rentDueDay, setRentDueDay] = useState<number>(5);
  const [startDate, setStartDate] = useState('2026-09-01');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1-Tap WhatsApp Welcome Invite Modal
  const [welcomeInviteModal, setWelcomeInviteModal] = useState<WelcomeInviteData | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Tenant[]>('/tenants');
      const hiddenIds: string[] = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('rentflow_hidden_tenants') || '[]')
        : [];
      setTenants(res.data.filter((t) => !hiddenIds.includes(t.id)));
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsForLease = async () => {
    try {
      const res = await apiRequest<any[]>('/properties');
      setProperties(res.data);

      const units: any[] = [];
      for (const p of res.data) {
        const uRes = await apiRequest<any[]>(`/properties/${p.id}/units`);
        for (const u of uRes.data) {
          if (u.status === 'VACANT') {
            units.push({ ...u, propertyName: p.name });
          }
        }
      }
      setAvailableUnits(units);
      if (units.length > 0) {
        setSelectedUnitId(units[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load units for lease:', err);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleOpenModal = async () => {
    setShowAddLease(true);
    await fetchUnitsForLease();
  };

  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setError('Please select an available unit');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedUnit = availableUnits.find((u) => u.id === selectedUnitId);

      await apiRequest('/leases', {
        method: 'POST',
        body: JSON.stringify({
          unitId: selectedUnitId,
          tenant: {
            name: tenantName.trim(),
            phone: tenantPhone.trim(),
            email: tenantEmail.trim() || undefined,
          },
          monthlyRent: Number(monthlyRent),
          maintenanceAmount: Number(maintenanceAmount || 0),
          securityDeposit: Number(securityDeposit || 0),
          rentDueDay: Number(rentDueDay),
          startDate,
        }),
      });

      const inviteData: WelcomeInviteData = {
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        unitNumber: selectedUnit?.unitNumber || 'Unit',
        propertyName: selectedUnit?.propertyName || 'Property',
        monthlyRent: Number(monthlyRent),
        rentDueDay: Number(rentDueDay),
      };

      setShowAddLease(false);
      setTenantName('');
      setTenantPhone('');
      setTenantEmail('');
      await fetchTenants();
      setWelcomeInviteModal(inviteData);
    } catch (err: any) {
      setError(err.message || 'Failed to create lease');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminateLease = async (leaseId: string) => {
    if (!confirm('Are you sure you want to end this lease? The unit will be marked as vacant.')) return;
    try {
      await apiRequest(`/leases/${leaseId}/terminate`, {
        method: 'PATCH',
      });
      await fetchTenants();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate lease');
    }
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setTenants((prev) => prev.filter((t) => t.id !== tenantId));

      if (typeof window !== 'undefined') {
        try {
          const hiddenIds: string[] = JSON.parse(localStorage.getItem('rentflow_hidden_tenants') || '[]');
          if (!hiddenIds.includes(tenantId)) {
            hiddenIds.push(tenantId);
            localStorage.setItem('rentflow_hidden_tenants', JSON.stringify(hiddenIds));
          }
        } catch {
          // ignore
        }
      }

      try {
        await apiRequest(`/tenants/${tenantId}`, {
          method: 'DELETE',
        });
      } catch (err: any) {
        console.warn('Backend DELETE route sync:', err?.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete tenant');
    }
  };

  const getWhatsAppInviteDetails = (data: WelcomeInviteData) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rentflow-mu.vercel.app';
    const loginUrl = `${origin}/login`;
    const cleanPhone = data.tenantPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `Namaste ${data.tenantName} Ji! 🙏\nWelcome to Unit ${data.unitNumber} at ${data.propertyName}.\n\nYour RentFlow portal is active:\n🏠 Monthly Rent: ₹${Number(data.monthlyRent).toLocaleString('en-IN')} (Due ${data.rentDueDay}th of month)\n⚡ Direct UPI Rent Payments (0% Gateway Fees)\n🧾 Instant Verified Rent Receipts\n🛠️ 1-Tap Maintenance & Repair Requests\n\nCheck your rent terms, pay via UPI, and download receipts here:\n${loginUrl}\n\n(Log in with your registered mobile: +91 ${cleanPhone.slice(-10)})`;

    const waLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

    return { message, waLink, cleanPhone };
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Tenants & Leases</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your resident directory, active contracts, monthly rent, and welcome invites.
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="primary"
          size="md"
        >
          New Lease Agreement
        </Button>
      </div>

      {/* Tenants Content */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading tenants...</p>
          </div>
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants registered yet"
          description="Create your first lease agreement to assign a tenant to an available unit and generate automatic rent bills."
          action={{
            label: 'Create Lease Agreement',
            onClick: handleOpenModal,
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => {
            const activeLease = t.leases.find((l) => l.status === 'ACTIVE') || t.leases[0];
            const hasActive = t.leases.some((l) => l.status === 'ACTIVE');

            return (
              <Card key={t.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 font-bold text-sm flex items-center justify-center shrink-0">
                        {t.name ? t.name[0].toUpperCase() : 'T'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 leading-snug">{t.name}</h3>
                        <span className="text-xs text-slate-500 font-mono block">{t.phone}</span>
                      </div>
                    </div>

                    <Badge
                      variant={hasActive ? 'success' : 'neutral'}
                      size="sm"
                      dot
                    >
                      {hasActive ? 'Active' : 'Ended'}
                    </Badge>
                  </div>

                  {activeLease && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unit</span>
                        <span className="font-semibold text-slate-800">
                          Unit {activeLease.unit.unitNumber} ({activeLease.unit.property.name})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rent</span>
                        <span className="font-bold text-slate-900 font-mono tabular-nums">
                          ₹{Number(activeLease.monthlyRent).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${t.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 border border-emerald-200/80"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${t.phone}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div>
                      {hasActive && activeLease ? (
                        <button
                          type="button"
                          onClick={() => handleTerminateLease(activeLease.id)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200"
                        >
                          End Lease
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteTenant(t.id, t.name)}
                          className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: New Lease Agreement */}
      <Modal
        isOpen={showAddLease}
        onClose={() => setShowAddLease(false)}
        title="New Lease Agreement"
        description="Assign a tenant to an available unit and define monthly terms."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLease} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Vacant Unit *
            </label>
            {availableUnits.length === 0 ? (
              <p className="text-xs text-rose-600 font-medium">
                No vacant units found. Please add a property and vacant unit first.
              </p>
            ) : (
              <select
                required
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.propertyName} - Unit {u.unitNumber} {u.floor ? `(Floor ${u.floor})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Tenant Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9811223344"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. rahul@example.com"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Monthly Rent (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="15000"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Maintenance (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="2000"
                value={maintenanceAmount}
                onChange={(e) => setMaintenanceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Rent Due Day *
              </label>
              <select
                value={rentDueDay}
                onChange={(e) => setRentDueDay(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition bg-white"
              >
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <option key={d} value={d}>
                    {d}th of every month
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setShowAddLease(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              disabled={availableUnits.length === 0}
            >
              Create Agreement & Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: 1-Tap WhatsApp Welcome Invite */}
      {welcomeInviteModal && (
        <Modal
          isOpen={true}
          onClose={() => setWelcomeInviteModal(null)}
          title="Lease Created Successfully!"
          description="Send the tenant their RentFlow portal invite via WhatsApp."
          maxWidth="md"
        >
          {(() => {
            const { message, waLink } = getWhatsAppInviteDetails(welcomeInviteModal);

            return (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Lease assigned to <strong>{welcomeInviteModal.tenantName}</strong> for <strong>Unit {welcomeInviteModal.unitNumber}</strong>.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      WhatsApp Invite Preview
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(message)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMessage ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {message}
                  </pre>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="w-full sm:w-auto"
                    onClick={() => setWelcomeInviteModal(null)}
                  >
                    Done / Close
                  </Button>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      type="button"
                      variant="success"
                      size="md"
                      className="w-full"
                      leftIcon={<MessageCircle className="w-4 h-4" />}
                    >
                      Send WhatsApp Welcome Invite
                    </Button>
                  </a>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
