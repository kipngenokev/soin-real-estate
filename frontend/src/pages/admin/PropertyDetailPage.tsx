import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { propertiesApi } from "../../lib/api/properties";
import { unitsApi } from "../../lib/api/units";
import type { Property, Unit, UnitStatus } from "../../lib/types";
import { UnitFormModal } from "../../components/properties/UnitFormModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pill } from "../../components/ui/Pill";

const typeLabel: Record<Unit["type"], string> = {
  STUDIO: "Studio",
  ONE_BEDROOM: "One bedroom",
};

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = Number(id);

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prop, list] = await Promise.all([
        propertiesApi.get(propertyId),
        unitsApi.listForProperty(propertyId),
      ]);
      setProperty(prop);
      setUnits(list);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load property")
          : "Failed to load property"
      );
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (Number.isFinite(propertyId) && propertyId > 0) reload();
  }, [propertyId, reload]);

  function onUnitSaved(u: Unit) {
    setUnits((prev) => {
      const exists = prev.find((i) => i.id === u.id);
      if (exists) return prev.map((i) => (i.id === u.id ? u : i));
      return [...prev, u].sort((a, b) => a.label.localeCompare(b.label));
    });
  }

  async function onToggleStatus(unit: Unit) {
    const next: UnitStatus = unit.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE";
    try {
      const updated = await unitsApi.setStatus(unit.id, next);
      setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to update status")
          : "Failed to update status"
      );
    }
  }

  async function confirmDeleteUnit() {
    if (!deletingUnit) return;
    setDeleteBusy(true);
    try {
      await unitsApi.remove(deletingUnit.id);
      setUnits((prev) => prev.filter((u) => u.id !== deletingUnit.id));
      setDeletingUnit(null);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to delete unit")
          : "Failed to delete unit"
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    return <div className="text-sm text-red-600">Invalid property id.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/properties" className="text-sm text-ink-muted hover:text-brand-600">
          ← Back to properties
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !property ? (
        <div className="text-sm text-ink-soft">Loading…</div>
      ) : property ? (
        <>
          <PageHeader
            eyebrow="Property"
            title={property.name}
            subtitle={property.location}
          />

          {property.description && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-ink-muted whitespace-pre-line">
                {property.description}
              </p>
              <div className="mt-4 text-xs text-ink-soft">
                {property._count?.units ?? units.length} unit
                {(property._count?.units ?? units.length) === 1 ? "" : "s"}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Units</h3>
            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitFormOpen(true);
              }}
              className="btn-primary"
            >
              + New unit
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Label</Th>
                  <Th>Type</Th>
                  <Th>Rent</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {units.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-ink-soft text-center">
                      No units yet.
                    </td>
                  </tr>
                )}
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.label}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{typeLabel[u.type]}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">
                      {Number(u.rentAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-3">
                      <button
                        onClick={() => onToggleStatus(u)}
                        className="text-ink-muted hover:text-brand-600 font-medium"
                      >
                        Mark {u.status === "AVAILABLE" ? "occupied" : "available"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingUnit(u);
                          setUnitFormOpen(true);
                        }}
                        className="text-ink-muted hover:text-brand-600 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingUnit(u)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-sm text-ink-soft">
          Property not found.{" "}
          <button
            onClick={() => navigate("/admin/properties")}
            className="text-ink-muted hover:text-brand-600 font-medium"
          >
            Go back
          </button>
        </div>
      )}

      <UnitFormModal
        open={unitFormOpen}
        propertyId={propertyId}
        initial={editingUnit}
        onClose={() => setUnitFormOpen(false)}
        onSaved={onUnitSaved}
      />

      <ConfirmDialog
        open={Boolean(deletingUnit)}
        title="Delete unit"
        message={deletingUnit ? `Delete unit "${deletingUnit.label}"? This cannot be undone.` : ""}
        onCancel={() => setDeletingUnit(null)}
        onConfirm={confirmDeleteUnit}
        busy={deleteBusy}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2 text-[11px] font-semibold text-ink-soft uppercase tracking-wider text-left ${className}`}
    >
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: UnitStatus }) {
  return (
    <Pill tone={status === "AVAILABLE" ? "emerald" : "amber"}>
      {status === "AVAILABLE" ? "Available" : "Occupied"}
    </Pill>
  );
}
