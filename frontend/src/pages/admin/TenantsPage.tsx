import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { tenantsApi } from "../../lib/api/tenants";
import type { Tenant } from "../../lib/types";
import { TenantFormModal } from "../../components/tenants/TenantFormModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

export function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Tenant | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const reload = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      setItems(await tenantsApi.list(q));
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load tenants")
          : "Failed to load tenants"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      reload(query.trim() || undefined);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, reload]);

  function onSaved(t: Tenant) {
    setItems((prev) => [t, ...prev.filter((i) => i.id !== t.id)]);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await tenantsApi.remove(deleting.id);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to delete tenant")
          : "Failed to delete tenant"
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-ink tracking-tight">Tenants</h2>
          <p className="text-sm text-ink-muted mt-1.5">
            Manage tenant accounts and unit assignments.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="px-3 py-2 text-sm font-medium rounded-md bg-brand-500 text-white hover:bg-brand-600"
        >
          + Onboard tenant
        </button>
      </div>

      <div className="flex">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone or ID number…"
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Assignment</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-ink-soft text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-ink-soft text-center">
                  {query
                    ? "No tenants match your search."
                    : "No tenants yet. Click Onboard tenant to add one."}
                </td>
              </tr>
            )}
            {!loading &&
              items.map((t) => {
                const lease = t.leases?.[0];
                const assignment = lease
                  ? `${lease.unit?.property?.name ?? "—"} · ${lease.unit?.label ?? ""}`
                  : "Unassigned";
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/admin/tenants/${t.id}`}
                        className="font-medium text-ink hover:text-brand-700"
                      >
                        {t.user.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{t.user.email}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{t.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{assignment}</td>
                    <td className="px-4 py-3 text-sm text-right space-x-3">
                      <Link
                        to={`/admin/tenants/${t.id}`}
                        className="text-ink-muted hover:text-brand-700 font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setDeleting(t)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <TenantFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete tenant"
        message={
          deleting
            ? `Delete tenant "${deleting.user.fullName}"? Any active lease will be ended and their login account will be removed. This cannot be undone.`
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
      className={`px-4 py-2 text-xs font-medium text-ink-soft uppercase tracking-wide text-left ${className}`}
    >
      {children}
    </th>
  );
}
