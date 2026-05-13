import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { propertiesApi } from "../../lib/api/properties";
import type { Property } from "../../lib/types";
import { PropertyFormModal } from "../../components/properties/PropertyFormModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

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

  useEffect(() => {
    reload();
  }, [reload]);

  function onSaved(p: Property) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === p.id);
      if (exists) return prev.map((i) => (i.id === p.id ? { ...i, ...p } : i));
      return [{ ...p, _count: { units: 0 } }, ...prev];
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Properties</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage buildings and their units.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="px-3 py-2 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800"
        >
          + New property
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Location</Th>
              <Th>Units</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                  No properties yet. Click <strong>New property</strong> to add one.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/admin/properties/${p.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p._count?.units ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-3">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="text-slate-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
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

      <PropertyFormModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete property"
        message={
          deleting
            ? `Delete "${deleting.name}"? This will also remove all of its units. This cannot be undone.`
            : ""
        }
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-left ${className}`}
    >
      {children}
    </th>
  );
}
