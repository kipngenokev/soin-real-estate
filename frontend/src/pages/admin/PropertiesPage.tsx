import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { propertiesApi } from "../../lib/api/properties";
import type { Property } from "../../lib/types";
import { PropertyFormModal } from "../../components/properties/PropertyFormModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatTile } from "../../components/ui/StatTile";
import { TONES } from "../../components/ui/tones";

const BuildingIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M3 21h18" />
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
  </svg>
);

export function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await propertiesApi.list());
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load properties")
          : "Failed to load properties"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const totals = useMemo(() => {
    const buildings = items.length;
    const units = items.reduce((sum, p) => sum + (p._count?.units ?? 0), 0);
    return { buildings, units };
  }, [items]);

  function onSaved(p: Property) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === p.id);
      if (exists) return prev.map((i) => (i.id === p.id ? { ...i, ...p } : i));
      return [p, ...prev];
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await propertiesApi.remove(deleting.id);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to delete property")
          : "Failed to delete property"
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        subtitle="Manage your buildings and the units inside them."
        actions={
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-brand-500 hover:bg-brand-600 transition-colors"
          >
            + New property
          </button>
        }
      />

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile tone="indigo" icon={BuildingIcon} label="Total properties"
                  value={loading ? "—" : totals.buildings} />
        <StatTile tone="teal" icon={BuildingIcon} label="Total units"
                  value={loading ? "—" : totals.units} />
        <StatTile tone="violet" icon={BuildingIcon} label="Average units / property"
                  value={loading ? "—" : totals.buildings === 0
                    ? 0 : (totals.units / totals.buildings).toFixed(1)} />
      </section>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-ink">All properties</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/60">
            <tr>
              <Th>Property</Th>
              <Th>Location</Th>
              <Th className="text-right">Units</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr><td colSpan={5} className="px-5 py-8 text-sm text-ink-soft text-center">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-sm text-ink-soft text-center">
                No properties yet. Click <strong>New property</strong> to add one.
              </td></tr>
            )}
            {!loading && items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: TONES.indigo.bg, color: TONES.indigo.fg }}>
                      {BuildingIcon}
                    </span>
                    <Link
                      to={`/admin/properties/${p.id}`}
                      className="font-medium text-ink hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-ink-muted">{p.location}</td>
                <td className="px-5 py-3.5 text-sm text-right text-ink tabular-nums font-medium">
                  {p._count?.units ?? 0}
                </td>
                <td className="px-5 py-3.5 text-sm text-ink-soft">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-sm text-right space-x-3">
                  <button onClick={() => { setEditing(p); setFormOpen(true); }}
                          className="text-ink-muted hover:text-brand-600 font-medium">
                    Edit
                  </button>
                  <button onClick={() => setDeleting(p)}
                          className="text-red-600 hover:text-red-700 font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <PropertyFormModal open={formOpen} initial={editing}
        onClose={() => setFormOpen(false)} onSaved={onSaved} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete property"
        message={deleting
          ? `Delete "${deleting.name}"? This will also remove all of its units. This cannot be undone.`
          : ""}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-2.5 text-[10.5px] font-semibold text-ink-soft uppercase tracking-wider text-left ${className}`}>
      {children}
    </th>
  );
}
