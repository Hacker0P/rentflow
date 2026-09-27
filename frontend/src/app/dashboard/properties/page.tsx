'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  AlertCircle,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Loader2,
  CheckCircle,
} from 'lucide-react';
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

interface Unit {
  id: string;
  unitNumber: string;
  floor?: number | null;
  status: 'VACANT' | 'OCCUPIED';
  propertyId: string;
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

  // Expanded Units view
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [propUnits, setPropUnits] = useState<Record<string, Unit[]>>({});
  const [loadingUnits, setLoadingUnits] = useState<Record<string, boolean>>({});

  // Delete Property Modal
  const [propToDelete, setPropToDelete] = useState<Property | null>(null);
  const [deletingProp, setDeletingProp] = useState(false);
  const [deletePropError, setDeletePropError] = useState<string | null>(null);

  // Delete Unit Modal
  const [unitToDelete, setUnitToDelete] = useState<{ id: string; unitNumber: string; propertyId: string } | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);
  const [deleteUnitError, setDeleteUnitError] = useState<string | null>(null);

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

  const loadUnitsForProperty = async (propertyId: string) => {
    try {
      setLoadingUnits((prev) => ({ ...prev, [propertyId]: true }));
      const res = await apiRequest<Unit[]>(`/properties/${propertyId}/units`);
      setPropUnits((prev) => ({ ...prev, [propertyId]: res.data }));
    } catch (err) {
      console.error('Failed to load units for property:', err);
    } finally {
      setLoadingUnits((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  const toggleExpandProperty = async (propertyId: string) => {
    if (expandedPropId === propertyId) {
      setExpandedPropId(null);
    } else {
      setExpandedPropId(propertyId);
      if (!propUnits[propertyId]) {
        await loadUnitsForProperty(propertyId);
      }
    }
  };

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
      const targetId = activePropId;
      setActivePropId(null);
      await fetchProperties();
      if (expandedPropId === targetId) {
        await loadUnitsForProperty(targetId);
      }
    } catch (err: any) {
      setUnitError(err.message || 'Failed to add unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propToDelete) return;
    setDeletingProp(true);
    setDeletePropError(null);

    try {
      await apiRequest(`/properties/${propToDelete.id}`, {
        method: 'DELETE',
      });
      const deletedId = propToDelete.id;
      setPropToDelete(null);
      if (expandedPropId === deletedId) {
        setExpandedPropId(null);
      }
      await fetchProperties();
    } catch (err: any) {
      setDeletePropError(err.message || 'Failed to remove property');
    } finally {
      setDeletingProp(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    setDeletingUnit(true);
    setDeleteUnitError(null);

    try {
      await apiRequest(`/units/${unitToDelete.id}`, {
        method: 'DELETE',
      });
      const { propertyId } = unitToDelete;
      setUnitToDelete(null);
      await fetchProperties();
      await loadUnitsForProperty(propertyId);
    } catch (err: any) {
      setDeleteUnitError(err.message || 'Failed to delete unit');
    } finally {
      setDeletingUnit(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Properties & Units</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your rental buildings, apartments, units, and occupancy.</p>
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

            const isExpanded = expandedPropId === prop.id;
            const unitsList = propUnits[prop.id] || [];
            const isLoadingUnits = loadingUnits[prop.id];

            return (
              <div
                key={prop.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-4 overflow-hidden w-full max-w-full"
              >
                <div className="w-full min-w-0 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/20 shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-base leading-tight break-words">
                          {prop.name}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-start gap-1.5 mt-1 leading-snug">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="break-words line-clamp-2 text-slate-600 font-medium">
                            {prop.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Property Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeletePropError(null);
                        setPropToDelete(prop);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 shrink-0"
                      title="Delete Property"
                      aria-label="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Occupancy Meter */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
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

                  {/* Collapsible Units Section */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExpandProperty(prop.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 text-xs font-semibold text-slate-700 transition"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Units ({prop.stats.totalUnits})</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-2 max-h-56 overflow-y-auto">
                        {isLoadingUnits ? (
                          <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Loading units...</span>
                          </div>
                        ) : unitsList.length === 0 ? (
                          <div className="text-center py-3 text-xs text-slate-400">
                            No units registered yet. Click &quot;Add Unit&quot; below.
                          </div>
                        ) : (
                          unitsList.map((unit) => (
                            <div
                              key={unit.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-slate-800 truncate">
                                  Unit {unit.unitNumber}
                                  {unit.floor !== null && unit.floor !== undefined && (
                                    <span className="ml-1 text-[11px] font-normal text-slate-500">
                                      (Floor {unit.floor})
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5">
                                  {unit.status === 'OCCUPIED' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                      Occupied
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                      Vacant
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Unit Delete Button (Only for vacant units) */}
                              {unit.status === 'VACANT' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteUnitError(null);
                                    setUnitToDelete({
                                      id: unit.id,
                                      unitNumber: unit.unitNumber,
                                      propertyId: prop.id,
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 shrink-0"
                                  title={`Delete Unit ${unit.unitNumber}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setActivePropId(prop.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Unit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletePropError(null);
                      setPropToDelete(prop);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 transition active:scale-95"
                    title="Delete Property"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Creating...' : 'Save Property'}</span>
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Adding...' : 'Add Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Property Confirmation Modal */}
      {propToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Remove Property</h3>
                <p className="text-xs text-slate-500">Confirm property deletion</p>
              </div>
            </div>

            {deletePropError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deletePropError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 text-sm">{propToDelete.name}</div>
              <div className="text-slate-500 leading-tight flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{propToDelete.address}</span>
              </div>
              <div className="flex items-center gap-4 pt-1 font-semibold text-slate-600">
                <span>Total Units: {propToDelete.stats.totalUnits}</span>
                <span>Occupied: {propToDelete.stats.occupiedUnits}</span>
                <span>Vacant: {propToDelete.stats.vacantUnits}</span>
              </div>
            </div>

            {propToDelete.stats.occupiedUnits > 0 ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Active Tenant Warning:</span> This property currently has{' '}
                  <span className="font-bold">{propToDelete.stats.occupiedUnits} active tenant(s)</span>.
                  To protect lease agreements, properties with active leases cannot be deleted. Please terminate
                  or conclude their leases in the Tenancy section before removing this property.
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-900">{propToDelete.name}</span>?{' '}
                {propToDelete.stats.totalUnits > 0 ? (
                  <span>
                    This will permanently delete this property along with all{' '}
                    <span className="font-bold">{propToDelete.stats.totalUnits} vacant unit(s)</span> and associated records.
                  </span>
                ) : (
                  <span>This property and its configuration will be permanently removed.</span>
                )}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPropToDelete(null);
                  setDeletePropError(null);
                }}
                disabled={deletingProp}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                disabled={deletingProp || propToDelete.stats.occupiedUnits > 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {deletingProp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingProp ? 'Removing...' : 'Yes, Remove Property'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Unit Confirmation Modal */}
      {unitToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Unit</h3>
                <p className="text-xs text-slate-500">Unit {unitToDelete.unitNumber}</p>
              </div>
            </div>

            {deleteUnitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteUnitError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">Unit {unitToDelete.unitNumber}</span>?
              This unit will be permanently removed from this property.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUnitToDelete(null);
                  setDeleteUnitError(null);
                }}
                disabled={deletingUnit}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUnit}
                disabled={deletingUnit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {deletingUnit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingUnit ? 'Deleting...' : 'Delete Unit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
