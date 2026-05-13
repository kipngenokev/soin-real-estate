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
import { HeroBanner } from "../components/ui/HeroBanner";
import { StatTile } from "../components/ui/StatTile";
import { Pill } from "../components/ui/Pill";
import { Avatar } from "../components/ui/Avatar";
import { TONES, initialsOf, type Tone } from "../components/ui/tones";

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtMoneyShort(v: string | number) {
  const n = Number(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short" });
}

const I = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 21h18" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  pie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 12a9 9 0 1 1-9-9v9z" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02z"
        clipRule="evenodd" />
    </svg>
  ),
  trendUp: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M3.5 12.5 8 8l3 3 5.5-5.5" stroke="currentColor" strokeWidth="2"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 5.5h5v5" stroke="currentColor" strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
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
          recentIssues: issues.slice(0, 4),
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
    return () => { cancelled = true; };
  }, []);

  const chart = useMemo(() => {
    const recent = data.summary.slice(-6);
    const values = recent.map((s) => Number(s.total));
    const max = values.reduce((m, v) => Math.max(m, v), 0);
    const total = values.reduce((a, b) => a + b, 0);
    const last = values.at(-1) ?? 0;
    const prev = values.at(-2) ?? 0;
    const delta = prev === 0 ? (last > 0 ? 1 : 0) : (last - prev) / prev;
    return { recent, values, max, total, last, prev, delta };
  }, [data.summary]);

  const s = data.stats;
  const occupancy = s?.occupancyRate ?? 0;
  const occupied = s?.units.occupied ?? 0;
  const available = s?.units.available ?? 0;

  return (
    <div className="space-y-10">
      <HeroBanner
        eyebrow={`Overview · ${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}`}
        title={`Welcome back${user ? `, ${user.fullName.split(" ")[0]}` : ""}.`}
        subtitle={
          loading
            ? "Loading your portfolio…"
            : `You're managing ${s?.properties ?? 0} ${s?.properties === 1 ? "property" : "properties"} with ${s?.units.total ?? 0} units · ${occupancy.toFixed(0)}% occupancy.`
        }
        actions={
          <Link
            to="/admin/tenants"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold bg-white text-brand-800 hover:bg-brand-50 transition-colors"
          >
            Onboard tenant {I.arrow}
          </Link>
        }
      />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI tiles */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile tone="indigo" icon={I.building} label="Properties"
             value={loading ? "—" : s?.properties ?? 0} href="/admin/properties" />
        <StatTile tone="teal" icon={I.grid} label="Units"
             value={loading ? "—" : s?.units.total ?? 0}
             hint={!loading && s ? `${occupied} occ · ${available} free` : undefined}
             href="/admin/properties" />
        <StatTile tone="emerald" icon={I.pie} label="Occupancy"
             value={loading ? "—" : `${occupancy.toFixed(0)}%`}
             hint={!loading && s ? `${occupied} of ${s.units.total} units` : undefined}
             progress={loading ? undefined : occupancy} />
        <StatTile tone="violet" icon={I.doc} label="Active leases"
             value={loading ? "—" : s?.activeLeases ?? 0} href="/admin/leases" />
        <StatTile tone="blue" icon={I.cash} label="Total payments"
             value={loading ? "—" : fmtMoneyShort(s?.payments.totalAmount ?? 0)}
             hint={!loading && s ? `${s.payments.count} entries` : undefined}
             href="/admin/payments" />
        <StatTile
          tone={s && s.openIssues > 0 ? "rose" : "amber"}
          icon={I.alert} label="Open issues"
          value={loading ? "—" : s?.openIssues ?? 0}
          hint={!loading && s && s.openIssues === 0 ? "All clear" : undefined}
          href="/admin/issues" />
      </section>

      {/* Charts row: revenue trend + occupancy donut */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue line/area chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Revenue</p>
              <h2 className="mt-1 text-[20px] font-semibold text-ink tracking-tightish">
                Payments collected
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">Last 6 months</p>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-semibold text-ink tracking-tightish tabular-nums">
                {loading ? "—" : fmtMoney(chart.total)}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-xs">
                {!loading && chart.delta !== 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 font-semibold"
                    style={{ color: chart.delta >= 0 ? "#047857" : "#be123c" }}
                  >
                    {I.trendUp}
                    {chart.delta > 0 ? "+" : ""}
                    {(chart.delta * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-ink-soft">vs prev. month</span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {loading || chart.recent.length === 0 ? (
              <div className="h-48 text-sm text-ink-soft flex items-center justify-center">
                {loading ? "Loading…" : "No payment data yet."}
              </div>
            ) : (
              <AreaChart values={chart.values} labels={chart.recent.map((r) => fmtMonth(r.month))} />
            )}
          </div>
        </div>

        {/* Occupancy donut */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col">
          <div>
            <p className="eyebrow">Occupancy</p>
            <h2 className="mt-1 text-[20px] font-semibold text-ink tracking-tightish">
              Unit utilization
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">Right now</p>
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            {loading ? (
              <div className="text-sm text-ink-soft">Loading…</div>
            ) : (
              <Donut value={occupancy} size={172} thickness={16}
                     centerLabel={`${occupancy.toFixed(0)}%`} />
            )}
          </div>

          <div className="space-y-1.5">
            <LegendRow color="#047857" label="Occupied" value={occupied} />
            <LegendRow color="#e4e4e7" label="Available" value={available} />
          </div>
        </div>
      </section>

      {/* Recent activity: leases + payments */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityCard
          title="Recent leases"
          viewAllHref="/admin/leases"
          empty={loading ? "Loading…" : "No leases yet."}
          rows={data.recentLeases.map((l) => {
            const status = l.status;
            const tone: Tone =
              status === "ACTIVE" ? "emerald" : status === "DRAFT" ? "amber" : "teal";
            return {
              id: l.id,
              href: `/admin/leases/${l.id}`,
              avatar: { initials: initialsOf(l.tenant?.user?.fullName), tone: "violet" as Tone },
              primary: l.tenant?.user?.fullName ?? `Tenant #${l.tenantId}`,
              secondary: `${l.unit?.property?.name ?? "—"} · ${l.unit?.label ?? "—"}`,
              right: (
                <Pill tone={tone}>
                  {status === "ACTIVE" ? "Active" : status === "DRAFT" ? "Draft" : "Ended"}
                </Pill>
              ),
            };
          })}
        />
        <ActivityCard
          title="Recent payments"
          viewAllHref="/admin/payments"
          empty={loading ? "Loading…" : "No payments yet."}
          rows={data.recentPayments.map((p) => {
            const tone: Tone = p.method === "MPESA" ? "emerald" : p.method === "BANK" ? "blue" : "amber";
            const methodLabel = p.method === "MPESA" ? "M-Pesa" : p.method === "BANK" ? "Bank" : "Cash";
            return {
              id: p.id,
              href: p.lease ? `/admin/tenants/${p.lease.tenantId}` : undefined,
              avatar: { initials: initialsOf(p.lease?.tenant?.user?.fullName), tone: "blue" as Tone },
              primary: p.lease?.tenant?.user?.fullName ?? `Lease #${p.leaseId}`,
              secondary: `${methodLabel} · ${new Date(p.paidAt).toLocaleDateString()}`,
              right: (
                <div className="flex items-center gap-2.5">
                  <Pill tone={tone}>{methodLabel}</Pill>
                  <span className="text-sm font-semibold text-ink tabular-nums">
                    {fmtMoney(p.amount)}
                  </span>
                </div>
              ),
            };
          })}
        />
      </section>

      {/* Open issues */}
      {(loading || data.recentIssues.length > 0) && (
        <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: TONES.amber.bg, color: TONES.amber.fg }}>
                {I.alert}
              </span>
              <div>
                <h2 className="text-[16px] font-semibold text-ink tracking-tightish">
                  Open maintenance issues
                </h2>
                <p className="text-xs text-ink-soft">
                  {loading ? "Loading…" :
                    `${data.recentIssues.length} ${data.recentIssues.length === 1 ? "request" : "requests"} need attention`}
                </p>
              </div>
            </div>
            <Link to="/admin/issues"
                  className="text-sm font-medium text-ink-muted hover:text-brand-600">
              View all →
            </Link>
          </div>
          {!loading && (
            <ul className="divide-y divide-gray-100">
              {data.recentIssues.map((i) => (
                <li key={i.id}>
                  <Link to={`/admin/tenants/${i.tenantId}`}
                        className="block px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink truncate">{i.title}</div>
                          <div className="text-xs text-ink-soft truncate mt-0.5">
                            {i.tenant?.user?.fullName ?? "—"} ·{" "}
                            {i.unit?.property?.name ?? "—"} {i.unit?.label ?? ""}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-ink-soft shrink-0 tabular-nums">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

// ───────────── Activity card ─────────────

type ActRow = {
  id: number;
  href?: string;
  avatar: { initials: string; tone: Tone };
  primary: React.ReactNode;
  secondary: React.ReactNode;
  right: React.ReactNode;
};

function ActivityCard({
  title, viewAllHref, rows, empty,
}: {
  title: string;
  viewAllHref: string;
  rows: ActRow[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Link to={viewAllHref} className="text-xs font-medium text-ink-muted hover:text-brand-600">
          View all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-sm text-ink-soft text-center">{empty}</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => {
            const inner = (
              <div className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex items-center gap-3">
                  <Avatar initials={r.avatar.initials} tone={r.avatar.tone} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{r.primary}</div>
                    <div className="text-xs text-ink-soft truncate mt-0.5">{r.secondary}</div>
                  </div>
                </div>
                <div className="shrink-0">{r.right}</div>
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

// ───────────── SVG Area Chart ─────────────

function AreaChart({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;

  const pts = values.map((v, i) => ({
    x: PAD.left + i * step,
    y: PAD.top + innerH - (v / max) * innerH,
  }));

  // Smooth path using a simple mid-point cubic bezier
  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
  const areaPath =
    `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + innerH} L ${pts[0].x} ${PAD.top + innerH} Z`;

  // Y-axis ticks: 0, 50%, 100%
  const ticks = [0, 0.5, 1].map((t) => ({
    y: PAD.top + innerH - t * innerH,
    label: t === 0 ? "0" : t === 1 ? fmtMoneyShort(max) : fmtMoneyShort(max * t),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56 overflow-visible">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y}
                stroke="#f1f5f9" strokeWidth="1" />
          <text x={PAD.left - 6} y={t.y + 3} textAnchor="end"
                fill="#a1a1aa" fontSize="10" fontWeight="500">
            {t.label}
          </text>
        </g>
      ))}

      {/* area + line */}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.25"
            strokeLinecap="round" strokeLinejoin="round" />

      {/* points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#2563eb" strokeWidth="2" />
        </g>
      ))}

      {/* x labels */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle"
              fill="#71717a" fontSize="10.5" fontWeight="500">
          {labels[i]}
        </text>
      ))}
    </svg>
  );
}

// ───────────── SVG Donut ─────────────

function Donut({
  value, size = 160, thickness = 16, centerLabel,
}: {
  value: number; // 0..100
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e4e4e7" strokeWidth={thickness}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#047857" strokeWidth={thickness}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[28px] font-semibold text-ink tracking-tightish tabular-nums leading-none">
          {centerLabel ?? `${value.toFixed(0)}%`}
        </div>
        <div className="text-[10.5px] uppercase tracking-wider text-ink-soft font-semibold mt-1">
          Occupied
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-ink-muted">{label}</span>
      </div>
      <span className="font-semibold text-ink tabular-nums">{value}</span>
    </div>
  );
}
