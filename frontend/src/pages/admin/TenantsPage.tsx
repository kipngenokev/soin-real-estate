import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { tenantsApi } from "../../lib/api/tenants";
import type { Tenant } from "../../lib/types";
import { TenantFormModal } from "../../components/tenants/TenantFormModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatTile } from "../../components/ui/StatTile";
import { Avatar } from "../../components/ui/Avatar";
import { Pill } from "../../components/ui/Pill";

const UsersIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M15 20a5 5 0 0 1 6.5-4.8" />
  </svg>
);

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

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      reload(query.trim() || undefined);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, reload]);

  const stats = useMemo(() => {
    const total = items.length;
    const assigned = items.filter((t) => t.leases?.[0]?.status === "ACTIVE").length;
    return { total, assigned, unassigned: total - assigned };
  }, [items]);

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Tenants"
        subtitle="Onboard tenants, assign them units and manage their accounts."
        actions={
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-brand-500 hover:bg-brand-600 transition-colors"
          >
            + Onboard tenant
          </button>
        }
      />

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile tone="violet" icon={UsersIcon} label="Total tenants"
                  value={loading ? "—" : stats.total} />
        <StatTile tone="emerald" icon={UsersIcon} label="With active lease"
                  value={loading ? "—" : stats.assigned} />
        <StatTile tone="amber" icon={UsersIcon} label="Unassigned"
                  value={loading ? "—" : stats.unassigned} />
      </section>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">All tenants</h3>
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-soft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone or ID…"
              className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/60">
            <tr>
              <Th>Tenant</Th>
              <Th>Contact</Th>
              <Th>Assignment</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr><td colSpan={4} className="px-5 py-8 text-sm text-ink-soft text-center">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-sm text-ink-soft text-center">
                {query ? "No tenants match your search."
                  : "No tenants yet. Click Onboard tenant to add one."}
              </td></tr>
            )}
            {!loading && items.map((t) => {
              const lease = t.leases?.[0];
              const active = lease?.status === "ACTIVE";
              return (
                <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.user.fullName} tone="violet" />
                      <Link
                        to={`/admin/tenants/${t.id}`}
                        className="font-medium text-ink hover:text-brand-600"
                      >
                        {t.user.fullName}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    <div className="text-ink-muted truncate">{t.user.email}</div>
                    <div className="text-xs text-ink-soft mt-0.5">{t.phone ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {active ? (
                      <div className="flex items-center gap-2">
                        <Pill tone="emerald">Active</Pill>
                        <span className="text-ink-muted">
                          {lease.unit?.property?.name ?? "—"} · {lease.unit?.label ?? "—"}
                        </span>
                      </div>
                    ) : (
                      <Pill tone="slate">Unassigned</Pill>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right space-x-3">
                    <Link
                      to={`/admin/tenants/${t.id}`}
                      className="text-ink-muted hover:text-brand-600 font-medium"
                    >
                      View
                    </Link>
                    <button onClick={() => setDeleting(t)}
                            className="text-red-600 hover:text-red-700 font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <TenantFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={onSaved} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete tenant"
        message={deleting
          ? `Delete tenant "${deleting.user.fullName}"? Any active lease will be ended and their login account will be removed. This cannot be undone.`
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
