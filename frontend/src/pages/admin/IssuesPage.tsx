import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { issuesApi } from "../../lib/api/issues";
import type { Issue, IssueStatus } from "../../lib/types";

const FILTERS: { value: IssueStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
];

export function IssuesPage() {
  const [items, setItems] = useState<Issue[]>([]);
  const [filter, setFilter] = useState<IssueStatus | "ALL">("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const reload = useCallback(async (status: IssueStatus | "ALL") => {
    setLoading(true);
    setError(null);
    try {
      const list = await issuesApi.list(status === "ALL" ? {} : { status });
      setItems(list);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load issues")
          : "Failed to load issues"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(filter);
  }, [filter, reload]);

  async function resolveIssue(id: number) {
    setResolvingId(id);
    setError(null);
    try {
      const updated = await issuesApi.resolve(id);
      setItems((prev) =>
        filter === "OPEN"
          ? prev.filter((i) => i.id !== id)
          : prev.map((i) => (i.id === id ? updated : i))
      );
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to resolve issue")
          : "Failed to resolve issue"
      );
    } finally {
      setResolvingId(null);
    }
  }

  const openCount = items.filter((i) => i.status === "OPEN").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-semibold text-ink tracking-tight">Maintenance issues</h2>
        <p className="text-sm text-ink-muted mt-1.5">
          Issues reported by tenants. Mark as resolved when fixed.
        </p>
      </div>

      <div className="flex items-center gap-3">
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
        {filter === "OPEN" && !loading && (
          <span className="text-xs text-ink-soft">
            {openCount} open issue{openCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Title</Th>
              <Th>Tenant</Th>
              <Th>Unit</Th>
              <Th>Status</Th>
              <Th>Reported</Th>
              <Th>Resolved</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-soft text-center">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-soft text-center">
                  No issues to show.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{i.title}</div>
                    <p className="text-xs text-ink-soft mt-1 whitespace-pre-line line-clamp-3">
                      {i.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {i.tenant ? (
                      <Link
                        to={`/admin/tenants/${i.tenantId}`}
                        className="text-slate-900 hover:underline"
                      >
                        {i.tenant.user.fullName}
                      </Link>
                    ) : (
                      `#${i.tenantId}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {i.unit?.property ? (
                      <Link
                        to={`/admin/properties/${i.unit.propertyId}`}
                        className="text-slate-900 hover:underline"
                      >
                        {i.unit.property.name} · {i.unit.label}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(i.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {i.resolvedAt ? new Date(i.resolvedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {i.status === "OPEN" && (
                      <button
                        onClick={() => resolveIssue(i.id)}
                        disabled={resolvingId === i.id}
                        className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {resolvingId === i.id ? "Resolving…" : "Mark resolved"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
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

function StatusBadge({ status }: { status: IssueStatus }) {
  const cls =
    status === "OPEN"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${cls}`}>
      {status === "OPEN" ? "Open" : "Resolved"}
    </span>
  );
}
