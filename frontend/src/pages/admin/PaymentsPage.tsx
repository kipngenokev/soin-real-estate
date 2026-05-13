import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { paymentsApi, type PaymentFilter } from "../../lib/api/payments";
import type { MonthlySummary, Payment, PaymentMethod } from "../../lib/types";
import { PaymentFormModal } from "../../components/payments/PaymentFormModal";
import { PaymentMethodBadge } from "../../components/payments/PaymentMethodBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/PageHeader";

const METHODS: { value: PaymentMethod | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank" },
  { value: "MPESA", label: "M-Pesa" },
];

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [method, setMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filter: PaymentFilter = useMemo(() => {
    const f: PaymentFilter = {};
    if (method !== "ALL") f.method = method;
    if (from) f.from = from;
    if (to) f.to = to;
    return f;
  }, [method, from, to]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([
        paymentsApi.list(filter),
        paymentsApi.summary({}),
      ]);
      setPayments(list);
      setSummary(sum);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load payments")
          : "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const mtdTotal = useMemo(() => {
    if (summary.length === 0) return "0.00";
    return summary[summary.length - 1].total;
  }, [summary]);

  const ytdTotal = useMemo(() => {
    return summary
      .reduce((acc, m) => acc + Number(m.total), 0)
      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [summary]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await paymentsApi.remove(deleting.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      // Refresh summary so deleted row drops from monthly totals.
      paymentsApi.summary({}).then(setSummary).catch(() => {});
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to delete payment")
          : "Failed to delete payment"
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Record and track rent payments across all leases."
        actions={
          <button
            onClick={() => setFormOpen(true)}
            className="btn-primary"
          >
            + Record payment
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="This month">{fmtMoney(mtdTotal)}</Card>
        <Card label="Last 12 months">{ytdTotal}</Card>
        <Card label="Total this month entries">
          {summary.length > 0 ? summary[summary.length - 1].count : 0}
        </Card>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-ink-muted">Monthly summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Month</Th>
                <Th className="text-right">Cash</Th>
                <Th className="text-right">Bank</Th>
                <Th className="text-right">M-Pesa</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Entries</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {summary.map((s) => (
                <tr key={s.month} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{fmtMonth(s.month)}</td>
                  <td className="px-4 py-2 text-right text-ink-muted">
                    {fmtMoney(s.byMethod.CASH)}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-muted">
                    {fmtMoney(s.byMethod.BANK)}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-muted">
                    {fmtMoney(s.byMethod.MPESA)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {fmtMoney(s.total)}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5 text-sm">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`px-3 py-1 rounded ${
                method === m.value ? "bg-ink text-white" : "text-ink-muted hover:bg-gray-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs text-ink-soft">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        {(from || to || method !== "ALL") && (
          <button
            onClick={() => {
              setMethod("ALL");
              setFrom("");
              setTo("");
            }}
            className="text-sm text-ink-muted hover:text-brand-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Paid on</Th>
              <Th>Tenant</Th>
              <Th>Unit</Th>
              <Th>Method</Th>
              <Th>Reference</Th>
              <Th className="text-right">Amount</Th>
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
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-soft text-center">
                  No payments found.
                </td>
              </tr>
            )}
            {!loading &&
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-ink-muted">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {p.lease?.tenant ? (
                      <Link
                        to={`/admin/tenants/${p.lease.tenantId}`}
                        className="font-medium text-ink hover:text-brand-600"
                      >
                        {p.lease.tenant.user.fullName}
                      </Link>
                    ) : (
                      `Lease #${p.leaseId}`
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">
                    {p.lease?.unit?.property?.name ?? "—"} · {p.lease?.unit?.label ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <PaymentMethodBadge method={p.method} />
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{p.reference ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {fmtMoney(p.amount)}
                  </td>
                  <td className="px-4 py-2 text-right">
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

      <PaymentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(p) => {
          setPayments((prev) => [p, ...prev]);
          paymentsApi.summary({}).then(setSummary).catch(() => {});
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete payment"
        message={
          deleting
            ? `Delete payment of ${fmtMoney(deleting.amount)} on ${new Date(
                deleting.paidAt
              ).toLocaleDateString()}? This cannot be undone.`
            : ""
        }
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="text-[32px] font-semibold text-ink tracking-tightish leading-none mt-2">{children}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2 text-[11px] font-semibold text-ink-soft uppercase tracking-wider text-left ${className}`}
    >
      {children}
    </th>
  );
}
