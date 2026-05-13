import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, type DashboardStats } from "../lib/api/dashboard";
import { leasesApi } from "../lib/api/leases";
import { paymentsApi } from "../lib/api/payments";
import { issuesApi } from "../lib/api/issues";
import type {
  Issue,
  LeaseDetail,
  MonthlySummary,
  Payment,
} from "../lib/types";
import { LeaseStatusBadge } from "../components/leases/LeaseStatusBadge";
import { PaymentMethodBadge } from "../components/payments/PaymentMethodBadge";

type LoadState = {
  stats: DashboardStats | null;
  summary: MonthlySummary[];
  recentLeases: LeaseDetail[];
  recentPayments: Payment[];
  recentIssues: Issue[];
};

const initial: LoadState = {
  stats: null,
  summary: [],
  recentLeases: [],
  recentPayments: [],
  recentIssues: [],
};

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short" });
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<LoadState>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [stats, summary, leases, payments, issues] = await Promise.all([
          dashboardApi.stats(),
          paymentsApi.summary({}),
          leasesApi.list({}),
          paymentsApi.list({}),
          issuesApi.list({ status: "OPEN" }),
        ]);
        if (cancelled) return;
        setData({
          stats,
          summary,
          recentLeases: leases.slice(0, 5),
          recentPayments: payments.slice(0, 5),
          recentIssues: issues.slice(0, 5),
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof AxiosError
            ? (err.response?.data?.message ?? "Failed to load dashboard")
            : "Failed to load dashboard"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chart = useMemo(() => {
    const recent = data.summary.slice(-6);
    const max = recent.reduce((m, s) => Math.max(m, Number(s.total)), 0);
    return { recent, max };
  }, [data.summary]);

  const s = data.stats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back{user ? `, ${user.fullName}` : ""}. Here's what's happening across your portfolio.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat
          label="Properties"
          value={loading ? "—" : s?.properties ?? 0}
          href="/admin/properties"
        />
        <Stat
          label="Units"
          value={loading ? "—" : s?.units.total ?? 0}
          hint={
            !loading && s
              ? `${s.units.occupied} occupied · ${s.units.available} available`
              : undefined
          }
          href="/admin/properties"
        />
        <Stat
          label="Occupancy"
          value={loading ? "—" : `${s?.occupancyRate.toFixed(1) ?? "0.0"}%`}
        />
        <Stat
          label="Active leases"
          value={loading ? "—" : s?.activeLeases ?? 0}
          href="/admin/leases"
        />
        <Stat
          label="Total payments"
          value={loading ? "—" : fmtMoney(s?.payments.totalAmount ?? 0)}
          hint={!loading && s ? `${s.payments.count} entries` : undefined}
          href="/admin/payments"
        />
        <Stat
          label="Open issues"
          value={loading ? "—" : s?.openIssues ?? 0}
          emphasis={s && s.openIssues > 0 ? "danger" : "ok"}
          href="/admin/issues"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Payments collected (last 6 months)
          </h3>
          <Link to="/admin/payments" className="text-xs text-slate-600 hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="h-32 text-sm text-gray-500 flex items-center justify-center">
            Loading…
          </div>
        ) : chart.recent.length === 0 ? (
          <div className="h-32 text-sm text-gray-500 flex items-center justify-center">
            No payment data yet.
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-3 items-end h-40">
            {chart.recent.map((m) => {
              const v = Number(m.total);
              const pct = chart.max === 0 ? 0 : Math.max((v / chart.max) * 100, v > 0 ? 4 : 0);
              return (
                <div key={m.month} className="flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-slate-900/80 rounded-t"
                      style={{ height: `${pct}%` }}
                      title={fmtMoney(m.total)}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500">{fmtMonth(m.month)}</div>
                  <div className="text-[11px] font-medium text-gray-700">
                    {v > 0 ? fmtMoney(m.total) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityCard
          title="Recent leases"
          viewAllHref="/admin/leases"
          empty={loading ? "Loading…" : "No leases yet."}
          rows={data.recentLeases.map((l) => ({
            id: l.id,
            href: `/admin/leases/${l.id}`,
            primary: l.tenant?.user?.fullName ?? `Tenant #${l.tenantId}`,
            secondary: `${l.unit?.property?.name ?? "—"} · ${l.unit?.label ?? "—"}`,
            meta: <LeaseStatusBadge status={l.status} />,
          }))}
        />
        <ActivityCard
          title="Recent payments"
          viewAllHref="/admin/payments"
          empty={loading ? "Loading…" : "No payments yet."}
          rows={data.recentPayments.map((p) => ({
            id: p.id,
            href: p.lease ? `/admin/tenants/${p.lease.tenantId}` : undefined,
            primary: p.lease?.tenant?.user?.fullName ?? `Lease #${p.leaseId}`,
            secondary: new Date(p.paidAt).toLocaleDateString(),
            meta: (
              <div className="flex items-center gap-2">
                <PaymentMethodBadge method={p.method} />
                <span className="font-semibold text-gray-900 tabular-nums">
                  {fmtMoney(p.amount)}
                </span>
              </div>
            ),
          }))}
        />
      </div>

      <ActivityCard
        title="Open issues"
        viewAllHref="/admin/issues"
        empty={loading ? "Loading…" : "No open issues. Nice."}
        rows={data.recentIssues.map((i) => ({
          id: i.id,
          href: `/admin/tenants/${i.tenantId}`,
          primary: i.title,
          secondary: `${i.tenant?.user?.fullName ?? "—"} · ${
            i.unit?.property?.name ?? "—"
          } ${i.unit?.label ?? ""}`,
          meta: (
            <span className="text-xs text-gray-500">
              {new Date(i.createdAt).toLocaleDateString()}
            </span>
          ),
        }))}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  emphasis?: "ok" | "danger";
}) {
  const valueClass =
    emphasis === "danger"
      ? "text-red-700"
      : emphasis === "ok"
        ? "text-gray-900"
        : "text-gray-900";

  const body = (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm h-full hover:border-gray-300 transition-colors">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold mt-2 tabular-nums ${valueClass}`}>{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );

  return href ? (
    <Link to={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

type ActivityRow = {
  id: number;
  href?: string;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  meta: React.ReactNode;
};

function ActivityCard({
  title,
  viewAllHref,
  rows,
  empty,
}: {
  title: string;
  viewAllHref: string;
  rows: ActivityRow[];
  empty: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <Link to={viewAllHref} className="text-xs text-slate-600 hover:underline">
          View all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-500 text-center">{empty}</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => {
            const inner = (
              <div className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{r.primary}</div>
                  <div className="text-xs text-gray-500 truncate">{r.secondary}</div>
                </div>
                <div className="shrink-0">{r.meta}</div>
              </div>
            );
            return (
              <li key={r.id}>
                {r.href ? <Link to={r.href}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
