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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';

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
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Properties & Units</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your buildings, apartments, individual flats, and live occupancy.
          </p>
        </div>
        <Button
          onClick={() => setShowAddProp(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="primary"
          size="md"
        >
          Add Property
        </Button>
      </div>

      {/* Property Cards */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2.5">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading properties...</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties registered yet"
          description="Add your first rental building to start configuring units and creating tenant leases."
          action={{
            label: 'Add First Property',
            onClick: () => setShowAddProp(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
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
              <Card
                key={prop.id}
                className="flex flex-col justify-between hover:border-slate-300 transition-all duration-200"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5 border border-blue-200/80 shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-base leading-snug break-words">
                          {prop.name}
                        </h3>
                        <div className="text-xs text-slate-500 flex items-start gap-1.5 mt-1 leading-snug">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="break-words line-clamp-2 text-slate-600">
                            {prop.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDeletePropError(null);
                        setPropToDelete(prop);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      title="Delete Property"
                      aria-label="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Occupancy Meter */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Occupancy</span>
                      <span className="font-bold text-blue-600">{occupancyPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Total</span>
                        <span className="font-semibold text-slate-800">{prop.stats.totalUnits} Units</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Occupied</span>
                        <span className="font-semibold text-emerald-600">{prop.stats.occupiedUnits}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Vacant</span>
                        <span className="font-semibold text-amber-600">{prop.stats.vacantUnits}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand / View Units Section */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Configured Units ({unitsList.length})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActivePropId(prop.id);
                            setUnitError(null);
                          }}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Add Unit
                        </Button>
                      </div>

                      {isLoadingUnits ? (
                        <div className="py-6 flex justify-center">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        </div>
                      ) : unitsList.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-200/80">
                          No units created yet for this building.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {unitsList.map((unit) => (
                            <div
                              key={unit.id}
                              className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  Unit {unit.unitNumber}
                                </span>
                                {unit.floor !== null && unit.floor !== undefined && (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    (Floor {unit.floor})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={unit.status === 'OCCUPIED' ? 'success' : 'warning'}
                                  size="sm"
                                  dot
                                >
                                  {unit.status}
                                </Badge>

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
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Unit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleExpandProperty(prop.id)}
                      rightIcon={
                        isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {isExpanded ? 'Hide Units' : 'View Units'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActivePropId(prop.id);
                        setUnitError(null);
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Unit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add New Property */}
      <Modal
        isOpen={showAddProp}
        onClose={() => setShowAddProp(false)}
        title="Add New Property"
        description="Register a building, commercial complex, or residential apartment."
      >
        <form onSubmit={handleCreateProperty} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Property Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sunshine Heights, Green Villa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Complete Address *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Flat 302, 12th Main, Koramangala, Bengaluru"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setShowAddProp(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              Save Property
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add New Unit */}
      <Modal
        isOpen={!!activePropId}
        onClose={() => setActivePropId(null)}
        title="Add Unit to Property"
        description="Create an apartment flat, commercial shop, or rental unit."
      >
        <form onSubmit={handleAddUnit} className="space-y-4">
          {unitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{unitError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Unit Number / Flat No *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101, 302, B-4, Shop 2"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Floor Number (Optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 1, 2, 3"
              value={floor}
              onChange={(e) => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setActivePropId(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              Save Unit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Delete Property Confirmation */}
      <Modal
        isOpen={!!propToDelete}
        onClose={() => setPropToDelete(null)}
        title="Delete Property"
        description="Are you sure you want to delete this property?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Deleting <strong className="text-slate-900">{propToDelete?.name}</strong> will remove the building and all its vacant units from your dashboard.
          </p>

          {deletePropError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deletePropError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setPropToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={deletingProp}
              onClick={handleDeleteProperty}
            >
              Delete Property
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Delete Unit Confirmation */}
      <Modal
        isOpen={!!unitToDelete}
        onClose={() => setUnitToDelete(null)}
        title="Delete Unit"
        description="Are you sure you want to delete this unit?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Deleting <strong className="text-slate-900">Unit {unitToDelete?.unitNumber}</strong> will permanently remove it from this building.
          </p>

          {deleteUnitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteUnitError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setUnitToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={deletingUnit}
              onClick={handleDeleteUnit}
            >
              Delete Unit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
