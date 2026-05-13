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

const STAT_ICONS = {
  Building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 21h18" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
    </svg>
  ),
  Grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Pie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 12a9 9 0 1 1-9-9v9z" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  ),
  Doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  ),
  Cash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  ),
  Alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  ),
};

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
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-soft font-semibold">
            Overview
          </p>
          <h2 className="text-3xl font-semibold text-ink tracking-tight mt-1">
            Welcome back{user ? `, ${user.fullName.split(" ")[0]}` : ""}
          </h2>
          <p className="text-sm text-ink-muted mt-1.5">
            Here's what's happening across your portfolio right now.
          </p>
        </div>
        <Link to="/admin/tenants" className="btn-primary">
          + Onboard tenant
        </Link>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="Properties" value={loading ? "—" : s?.properties ?? 0}
              icon={STAT_ICONS.Building} href="/admin/properties" />
        <Stat label="Units" value={loading ? "—" : s?.units.total ?? 0}
              icon={STAT_ICONS.Grid}
              hint={!loading && s ? `${s.units.occupied} occupied · ${s.units.available} free` : undefined}
              href="/admin/properties" />
        <Stat label="Occupancy" value={loading ? "—" : `${s?.occupancyRate.toFixed(1) ?? "0.0"}%`}
              icon={STAT_ICONS.Pie} />
        <Stat label="Active leases" value={loading ? "—" : s?.activeLeases ?? 0}
              icon={STAT_ICONS.Doc} href="/admin/leases" />
        <Stat label="Total payments" value={loading ? "—" : fmtMoney(s?.payments.totalAmount ?? 0)}
              icon={STAT_ICONS.Cash}
              hint={!loading && s ? `${s.payments.count} entries` : undefined}
              href="/admin/payments" />
        <Stat label="Open issues" value={loading ? "—" : s?.openIssues ?? 0}
              icon={STAT_ICONS.Alert}
              emphasis={s && s.openIssues > 0 ? "danger" : "ok"}
              href="/admin/issues" />
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-ink">Payments collected</h3>
            <p className="text-xs text-ink-soft mt-0.5">Last 6 months</p>
          </div>
          <Link to="/admin/payments" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="h-40 text-sm text-ink-soft flex items-center justify-center">
            Loading…
          </div>
        ) : chart.recent.length === 0 ? (
          <div className="h-40 text-sm text-ink-soft flex items-center justify-center">
            No payment data yet.
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4 items-end h-44">
            {chart.recent.map((m) => {
              const v = Number(m.total);
              const pct = chart.max === 0 ? 0 : Math.max((v / chart.max) * 100, v > 0 ? 6 : 0);
              return (
                <div key={m.month} className="flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        v > 0 ? "bg-brand-500" : "bg-gray-100"
                      }`}
                      style={{ height: `${pct}%` }}
                      title={fmtMoney(m.total)}
                    />
                  </div>
                  <div className="text-[11px] text-ink-soft">{fmtMonth(m.month)}</div>
                  <div className="text-xs font-semibold text-ink tabular-nums">
                    {v > 0 ? fmtMoney(m.total) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                <span className="font-semibold text-ink tabular-nums">
                  {fmtMoney(p.amount)}
                </span>
              </div>
            ),
          }))}
        />
      </section>

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
            <span className="text-xs text-ink-soft">
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
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  emphasis?: "ok" | "danger";
  icon?: React.ReactNode;
}) {
  const valueClass =
    emphasis === "danger" ? "text-red-700" : "text-ink";

  const iconBg =
    emphasis === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600";

  const body = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 h-full hover:border-gray-200 hover:shadow-lift transition-all">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.06em] text-ink-soft font-semibold">
          {label}
        </span>
        {icon && (
          <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
            {icon}
          </span>
        )}
      </div>
      <div className={`text-2xl font-semibold mt-2 tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-ink-soft mt-1">{hint}</div>}
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Link to={viewAllHref} className="text-sm font-medium text-brand-700 hover:text-brand-800">
          View all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-sm text-ink-soft text-center">{empty}</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => {
            const inner = (
              <div className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{r.primary}</div>
                  <div className="text-xs text-ink-soft truncate mt-0.5">{r.secondary}</div>
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
