'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Phone, Mail, Home, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
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

interface UnitOption {
  id: string;
  unitNumber: string;
  status: string;
  property: {
    name: string;
  };
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
      await apiRequest('/leases', {
        method: 'POST',
        body: JSON.stringify({
          unitId: selectedUnitId,
          tenant: {
            name: tenantName,
            phone: tenantPhone,
            email: tenantEmail || undefined,
          },
          monthlyRent: Number(monthlyRent),
          maintenanceAmount: Number(maintenanceAmount || 0),
          securityDeposit: Number(securityDeposit || 0),
          rentDueDay: Number(rentDueDay),
          startDate,
        }),
      });

      setShowAddLease(false);
      setTenantName('');
      setTenantPhone('');
      setTenantEmail('');
      await fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Failed to create lease');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminateLease = async (leaseId: string) => {
    if (!confirm('Are you sure you want to terminate this lease? The unit will be marked as vacant.')) return;
    try {
      await apiRequest(`/leases/${leaseId}/terminate`, {
        method: 'PATCH',
      });
      await fetchTenants();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate lease');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tenants & Rental Leases</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage tenant directory, active leases, monthly rent, and contract terms.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Lease Agreement</span>
        </button>
      </div>

      {/* Tenants Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No tenants registered yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;New Lease Agreement&quot; to assign a tenant to an available unit and define monthly rent.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
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
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t) => (
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
                      {t.leases.length > 0 ? (
                        <div>
                          <span className="font-semibold text-slate-800 block text-xs">
                            {t.leases[0].unit.unitNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {t.leases[0].unit.property.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No active unit</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {t.leases.length > 0 ? (
                        <>
                          ₹{Number(t.leases[0].monthlyRent).toLocaleString('en-IN')}
                          {Number(t.leases[0].maintenanceAmount) > 0 && (
                            <span className="text-[11px] font-normal text-slate-500 block">
                              + ₹{Number(t.leases[0].maintenanceAmount).toLocaleString('en-IN')} maint
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      {t.leases.length > 0 ? `${t.leases[0].rentDueDay}th of month` : '—'}
                    </td>
                    <td className="py-4 px-4">
                      {t.leases.length > 0 && t.leases[0].status === 'ACTIVE' ? (
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
                      {t.leases.length > 0 && t.leases[0].status === 'ACTIVE' && (
                        <button
                          onClick={() => handleTerminateLease(t.leases[0].id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-medium transition"
                        >
                          Terminate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Lease Agreement Modal */}
      {showAddLease && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-mono"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={maintenanceAmount}
                    onChange={(e) => setMaintenanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none font-bold"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLease(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableUnits.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Activate Lease'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
