'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Home,
  AlertCircle,
  FileText,
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
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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
      setTenants(res.data);
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

      // Collect all vacant units
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

      // Prepare 1-Tap WhatsApp Welcome Invite Data
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

      // Immediately present the 1-Tap WhatsApp Invite Modal!
      setWelcomeInviteModal(inviteData);
    } catch (err: any) {
      setError(err.message || 'Failed to create lease');
    } finally {
      setSubmitting(false);
    }
  };

  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);

  const handleTerminateLease = async (leaseId: string) => {
    if (!confirm('Are you sure you want to end/terminate this lease? The unit will be marked as vacant, and you will then be able to delete the tenant record if needed.')) return;
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
    if (
      !confirm(
        `Are you sure you want to delete tenant "${tenantName}"?\n\nThis will remove the tenant, end any active lease, free up their unit, and remove them from your directory. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingTenantId(tenantId);
      await apiRequest(`/tenants/${tenantId}`, {
        method: 'DELETE',
      });
      await fetchTenants();
    } catch (err: any) {
      alert(err.message || 'Failed to delete tenant');
    } finally {
      setDeletingTenantId(null);
    }
  };

  // Helper to generate formatted WhatsApp invite text & link
  const getWhatsAppInviteDetails = (data: WelcomeInviteData) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rentflow-mu.vercel.app';
    const loginUrl = `${origin}/login`;
    const cleanPhone = data.tenantPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `Namaste ${data.tenantName} Ji! 🙏
Welcome to Unit ${data.unitNumber} at ${data.propertyName}.

Your RentFlow portal is active:
🏠 Monthly Rent: ₹${Number(data.monthlyRent).toLocaleString('en-IN')} (Due ${data.rentDueDay}th of month)
⚡ Direct UPI Rent Payments (0% Gateway Fees)
🧾 Instant Verified Rent Receipts
🛠️ 1-Tap Maintenance & Repair Requests

Check your rent terms, pay via UPI, and download receipts here:
${loginUrl}

(Log in with your registered mobile: +91 ${cleanPhone.slice(-10)})`;

    const waLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

    return { message, waLink, cleanPhone };
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tenants &amp; Leases</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage tenant directory, active leases, monthly rent, and contract terms.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Lease Agreement</span>
        </button>
      </div>

      {/* Tenants Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No tenants registered yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;New Lease Agreement&quot; to assign a tenant to an available unit, define rent, and send an instant 1-tap WhatsApp welcome invite.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* 1. Mobile App Card View (< lg screens)                                    */}
          {/* ========================================================================= */}
          <div className="lg:hidden space-y-3">
            {tenants.map((t) => {
              const activeLease = t.leases.find((l) => l.status === 'ACTIVE') || t.leases[0];
              const cleanPhone = t.phone ? t.phone.replace(/[^0-9]/g, '') : '';

              const inviteData: WelcomeInviteData | null = activeLease
                ? {
                    tenantName: t.name,
                    tenantPhone: t.phone,
                    unitNumber: activeLease.unit.unitNumber,
                    propertyName: activeLease.unit.property.name,
                    monthlyRent: Number(activeLease.monthlyRent),
                    rentDueDay: activeLease.rentDueDay,
                  }
                : null;

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 hover:border-slate-300 transition"
                >
                  {/* Top Tenant Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-950/20 shrink-0">
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{t.name}</h4>
                        {activeLease ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-block mt-1">
                            Unit {activeLease.unit.unitNumber} • {activeLease.unit.property.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic block mt-0.5">No active unit</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {activeLease && activeLease.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Ended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financials & Terms Grid */}
                  {activeLease && (
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Rent</span>
                        <span className="text-xs font-black text-slate-900">
                          ₹{Number(activeLease.monthlyRent).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Maint</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {Number(activeLease.maintenanceAmount) > 0
                            ? `+₹${Number(activeLease.maintenanceAmount).toLocaleString('en-IN')}`
                            : 'Included'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Due Day</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {activeLease.rentDueDay}th of month
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contact & 1-Tap Invite Row */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1-Tap WhatsApp Welcome Invite Button */}
                      {inviteData && (
                        <button
                          type="button"
                          onClick={() => setWelcomeInviteModal(inviteData)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-bold border border-[#25D366]/40 transition active:scale-95 shadow-2xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>WhatsApp Invite</span>
                        </button>
                      )}

                      {t.phone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeLease && activeLease.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleTerminateLease(activeLease.id)}
                          className="px-2.5 py-1 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-semibold transition"
                          title="End active lease"
                        >
                          End Lease
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteTenant(t.id, t.name)}
                          disabled={deletingTenantId === t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-[11px] font-bold transition disabled:opacity-50"
                          title="Delete ended tenant from directory"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>{deletingTenantId === t.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 2. Desktop Full Table View (>= lg screens)                                */}
          {/* ========================================================================= */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Tenant Name</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Unit / Property</th>
                    <th className="py-3.5 px-4">Monthly Rent + Maint</th>
                    <th className="py-3.5 px-4">Due Day</th>
                    <th className="py-3.5 px-4">Lease Status</th>
                    <th className="py-3.5 px-4 text-right">1-Tap WhatsApp &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => {
                    const activeLease = t.leases.find((l) => l.status === 'ACTIVE') || t.leases[0];
                    const cleanPhone = t.phone ? t.phone.replace(/[^0-9]/g, '') : '';

                    const inviteData: WelcomeInviteData | null = activeLease
                      ? {
                          tenantName: t.name,
                          tenantPhone: t.phone,
                          unitNumber: activeLease.unit.unitNumber,
                          propertyName: activeLease.unit.property.name,
                          monthlyRent: Number(activeLease.monthlyRent),
                          rentDueDay: activeLease.rentDueDay,
                        }
                      : null;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-4 font-bold text-slate-900 text-xs">
                          {t.name}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-700 flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {t.phone}
                          </span>
                          {t.email && (
                            <span className="text-slate-400 flex items-center gap-1 text-[11px] mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {t.email}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {activeLease ? (
                            <div>
                              <span className="font-semibold text-slate-800 block text-xs">
                                Unit {activeLease.unit.unitNumber}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {activeLease.unit.property.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No active unit</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {activeLease ? (
                            <>
                              ₹{Number(activeLease.monthlyRent).toLocaleString('en-IN')}
                              {Number(activeLease.maintenanceAmount) > 0 && (
                                <span className="text-[11px] font-normal text-slate-500 block">
                                  + ₹{Number(activeLease.maintenanceAmount).toLocaleString('en-IN')} maint
                                </span>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {activeLease ? `${activeLease.rentDueDay}th of month` : '—'}
                        </td>
                        <td className="py-4 px-4">
                          {activeLease && activeLease.status === 'ACTIVE' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Active Lease
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              Ended
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inviteData && (
                              <button
                                type="button"
                                onClick={() => setWelcomeInviteModal(inviteData)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs border border-[#25D366]/40 transition active:scale-95"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                                <span>WhatsApp Invite</span>
                              </button>
                            )}

                            {activeLease && activeLease.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleTerminateLease(activeLease.id)}
                                className="px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition"
                                title="End active lease and mark unit as vacant"
                              >
                                End Lease
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteTenant(t.id, t.name)}
                                disabled={deletingTenantId === t.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition disabled:opacity-50"
                                title="Delete ended tenant from directory"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>{deletingTenantId === t.id ? 'Deleting...' : 'Delete Tenant'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. 1-Tap WhatsApp Welcome & Portal Invite Modal                            */}
      {/* ========================================================================= */}
      {welcomeInviteModal && (() => {
        const { message, waLink, cleanPhone } = getWhatsAppInviteDetails(welcomeInviteModal);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 space-y-5 animate-in zoom-in-95 relative text-slate-900 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setWelcomeInviteModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Celebration Header */}
              <div className="flex items-start gap-3.5 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white flex items-center justify-center font-bold shadow-lg shadow-[#25D366]/30 shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold mb-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Lease Created &amp; Tenant Ready!</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">
                    Send WhatsApp Welcome Invite
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Welcome <span className="font-bold text-slate-800">{welcomeInviteModal.tenantName}</span> to Unit {welcomeInviteModal.unitNumber}. Send their login link with 1 tap.
                  </p>
                </div>
              </div>

              {/* Formatted WhatsApp Message Preview Bubble */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp Message Preview</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">To: +91 {cleanPhone.slice(-10)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#E7F8E8] border border-[#25D366]/30 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans shadow-inner select-text">
                  {message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* 1-Tap WhatsApp Primary CTA */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#25D366]/30 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Send WhatsApp Welcome Invite</span>
                  <ExternalLink className="w-4 h-4 ml-0.5 opacity-80" />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  {/* Copy Message Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(message)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copy Invite Text</span>
                      </>
                    )}
                  </button>

                  {/* Close / Done Button */}
                  <button
                    type="button"
                    onClick={() => setWelcomeInviteModal(null)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 4. New Lease Agreement Modal                                              */}
      {/* ========================================================================= */}
      {showAddLease && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base mb-1">New Lease Agreement</h3>
            <p className="text-xs text-slate-500 mb-4">Assign a tenant to an available unit and specify rent terms.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateLease} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Vacant Unit</label>
                {availableUnits.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    No vacant units found. Please add a unit or terminate an existing lease first.
                  </div>
                ) : (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none bg-white font-medium"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} — {u.propertyName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Full Name</label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Amit Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Phone Number</label>
                  <input
                    type="text"
                    required
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant Email (Optional)</label>
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="amit.kumar@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={maintenanceAmount}
                    onChange={(e) => setMaintenanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rent Due Day (1 to 28)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={28}
                    value={rentDueDay}
                    onChange={(e) => setRentDueDay(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lease Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLease(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableUnits.length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Activate Lease & Invite Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
