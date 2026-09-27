'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus, Home, MapPin, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Property {
  id: string;
  name: string;
  address: string;
  stats: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // New Property Modal
  const [showAddProp, setShowAddProp] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Unit Modal
  const [activePropId, setActivePropId] = useState<string | null>(null);
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState<number | ''>('');
  const [unitError, setUnitError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Property[]>('/properties');
      setProperties(res.data);
    } catch (err: any) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest('/properties', {
        method: 'POST',
        body: JSON.stringify({ name, address }),
      });
      setName('');
      setAddress('');
      setShowAddProp(false);
      await fetchProperties();
    } catch (err: any) {
      setError(err.message || 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePropId) return;
    setSubmitting(true);
    setUnitError(null);

    try {
      await apiRequest(`/properties/${activePropId}/units`, {
        method: 'POST',
        body: JSON.stringify({
          unitNumber,
          floor: floor === '' ? undefined : Number(floor),
        }),
      });
      setUnitNumber('');
      setFloor('');
      setActivePropId(null);
      await fetchProperties();
    } catch (err: any) {
      setUnitError(err.message || 'Failed to add unit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Properties & Units</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your rental buildings, apartments, and occupancy status.</p>
        </div>
        <button
          onClick={() => setShowAddProp(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Property</span>
        </button>
      </div>

      {/* Property Cards */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No properties added yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click &quot;Add New Property&quot; to register your first rental building and start adding units.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((prop) => {
            const occupancyPct =
              prop.stats.totalUnits > 0
                ? Math.round((prop.stats.occupiedUnits / prop.stats.totalUnits) * 100)
                : 0;

            return (
              <div
                key={prop.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/20 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-base leading-tight truncate">{prop.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prop.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy Meter */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupancy</span>
                      <span className="font-extrabold text-emerald-700">{occupancyPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total</span>
                        <span className="font-bold text-slate-800">{prop.stats.totalUnits} Units</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-semibold block uppercase">Occupied</span>
                        <span className="font-bold text-emerald-700">{prop.stats.occupiedUnits}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-600 font-semibold block uppercase">Vacant</span>
                        <span className="font-bold text-amber-700">{prop.stats.vacantUnits}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActivePropId(prop.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Unit / Flat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddProp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add New Property</h3>
            <p className="text-xs text-slate-500 mb-4">Enter the building name and location address.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Property Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Green Residency"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Palm Avenue, Indiranagar, Bengaluru, Karnataka"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProp(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {activePropId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Unit / Flat</h3>
            <p className="text-xs text-slate-500 mb-4">Add a rentable unit to this property.</p>

            {unitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{unitError}</span>
              </div>
            )}

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Flat Number</label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. 101, Flat 2B, Shop 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Floor (Optional)</label>
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g. 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePropId(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
