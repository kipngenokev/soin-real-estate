import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { leasesApi } from "../../lib/api/leases";
import type { LeaseDetail, LeaseStatus } from "../../lib/types";
import { LeaseFormModal } from "../../components/leases/LeaseFormModal";
import { LeaseStatusBadge } from "../../components/leases/LeaseStatusBadge";

const FILTERS: { value: LeaseStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
];

export function LeasesPage() {
  const [items, setItems] = useState<LeaseDetail[]>([]);
  const [filter, setFilter] = useState<LeaseStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const reload = useCallback(async (status: LeaseStatus | "ALL") => {
    setLoading(true);
    setError(null);
    try {
      const items = await leasesApi.list(status === "ALL" ? {} : { status });
      setItems(items);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load leases")
          : "Failed to load leases"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(filter);
  }, [filter, reload]);

  function onCreated(lease: LeaseDetail) {
    setItems((prev) => [lease, ...prev]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-ink tracking-tight">Leases</h2>
          <p className="text-sm text-ink-muted mt-1.5">
            Track lease lifecycle: create, activate, end.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="px-3 py-2 text-sm font-medium rounded-md bg-brand-500 text-white hover:bg-brand-600"
        >
          + New lease
        </button>
      </div>

      <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5 text-sm">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded ${
              filter === f.value
                ? "bg-slate-900 text-white"
                : "text-ink-muted hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
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
              <Th>Tenant</Th>
              <Th>Unit</Th>
              <Th>Status</Th>
              <Th>Rent</Th>
              <Th>Started</Th>
              <Th>Ended</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-ink-soft text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-ink-soft text-center">
                  No leases found.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/admin/leases/${l.id}`}
                      className="font-medium text-ink hover:text-brand-700"
                    >
                      {l.tenant?.user?.fullName ?? `Tenant #${l.tenantId}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {l.unit?.property?.name ?? "—"} · {l.unit?.label ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <LeaseStatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {Number(l.monthlyRent).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-soft">
                    {l.startDate ? new Date(l.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-soft">
                    {l.endDate ? new Date(l.endDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Link
                      to={`/admin/leases/${l.id}`}
                      className="text-ink-muted hover:text-brand-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <LeaseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={onCreated}
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
