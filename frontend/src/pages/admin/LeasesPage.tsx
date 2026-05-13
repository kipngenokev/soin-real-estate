import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { leasesApi } from "../../lib/api/leases";
import type { LeaseDetail, LeaseStatus } from "../../lib/types";
import { LeaseFormModal } from "../../components/leases/LeaseFormModal";
import { LeaseStatusBadge } from "../../components/leases/LeaseStatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatTile } from "../../components/ui/StatTile";
import { Avatar } from "../../components/ui/Avatar";
import { TONES, initialsOf } from "../../components/ui/tones";

const DocIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </svg>
);

const FILTERS: { value: LeaseStatus | "ALL"; label: string; tone?: keyof typeof TONES }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft", tone: "amber" },
  { value: "ACTIVE", label: "Active", tone: "emerald" },
  { value: "ENDED", label: "Ended", tone: "slate" },
];

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

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
      setItems(await leasesApi.list(status === "ALL" ? {} : { status }));
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

  useEffect(() => { reload(filter); }, [filter, reload]);

  const stats = useMemo(() => {
    const all = items;
    const active = all.filter((l) => l.status === "ACTIVE");
    const totalRent = active.reduce((sum, l) => sum + Number(l.monthlyRent), 0);
    return {
      active: active.length,
      ended: all.filter((l) => l.status === "ENDED").length,
      monthlyRent: totalRent,
    };
  }, [items]);

  function onCreated(lease: LeaseDetail) {
    setItems((prev) => [lease, ...prev]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agreements"
        title="Leases"
        subtitle="Every active and historical tenancy at a glance."
        actions={
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-brand-500 hover:bg-brand-600 transition-colors"
          >
            + New lease
          </button>
        }
      />

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile tone="emerald" icon={DocIcon} label="Active leases"
                  value={loading ? "—" : stats.active} />
        <StatTile tone="blue" icon={DocIcon} label="Monthly rent committed"
                  value={loading ? "—" : fmtMoney(stats.monthlyRent)} />
        <StatTile tone="slate" icon={DocIcon} label="Ended"
                  value={loading ? "—" : stats.ended} />
      </section>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-ink">All leases</h3>
          <div className="inline-flex gap-1.5">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-ink text-white"
                      : "bg-gray-50 text-ink-muted hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/60">
            <tr>
              <Th>Tenant</Th>
              <Th>Unit</Th>
              <Th>Status</Th>
              <Th className="text-right">Rent</Th>
              <Th>Started</Th>
              <Th>Ended</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr><td colSpan={7} className="px-5 py-8 text-sm text-ink-soft text-center">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-sm text-ink-soft text-center">No leases found.</td></tr>
            )}
            {!loading && items.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={initialsOf(l.tenant?.user?.fullName)} tone="violet" />
                    <Link to={`/admin/leases/${l.id}`}
                          className="font-medium text-ink hover:text-brand-600">
                      {l.tenant?.user?.fullName ?? `Tenant #${l.tenantId}`}
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-ink-muted">
                  {l.unit?.property?.name ?? "—"} · {l.unit?.label ?? "—"}
                </td>
                <td className="px-5 py-3.5 text-sm">
                  <LeaseStatusBadge status={l.status} />
                </td>
                <td className="px-5 py-3.5 text-sm text-right text-ink tabular-nums font-medium">
                  {fmtMoney(l.monthlyRent)}
                </td>
                <td className="px-5 py-3.5 text-sm text-ink-soft">
                  {l.startDate ? new Date(l.startDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3.5 text-sm text-ink-soft">
                  {l.endDate ? new Date(l.endDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3.5 text-sm text-right">
                  <Link to={`/admin/leases/${l.id}`}
                        className="text-ink-muted hover:text-brand-600 font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <LeaseFormModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={onCreated} />
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
