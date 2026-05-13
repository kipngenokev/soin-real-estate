import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { tenantsApi } from "../../lib/api/tenants";
import { paymentsApi } from "../../lib/api/payments";
import type { Tenant, TenantPaymentsView } from "../../lib/types";
import { TenantFormModal } from "../../components/tenants/TenantFormModal";
import { AssignLeaseModal } from "../../components/tenants/AssignLeaseModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LeaseStatusBadge } from "../../components/leases/LeaseStatusBadge";
import { PaymentMethodBadge } from "../../components/payments/PaymentMethodBadge";
import { PaymentFormModal } from "../../components/payments/PaymentFormModal";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = Number(id);
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [paymentsView, setPaymentsView] = useState<TenantPaymentsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [endingLease, setEndingLease] = useState(false);
  const [endLeaseBusy, setEndLeaseBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, payments] = await Promise.all([
        tenantsApi.get(tenantId),
        paymentsApi.forTenant(tenantId),
      ]);
      setTenant(t);
      setPaymentsView(payments);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load tenant")
          : "Failed to load tenant"
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (Number.isFinite(tenantId) && tenantId > 0) reload();
  }, [tenantId, reload]);

  async function onEndLease() {
    setEndLeaseBusy(true);
    try {
      await tenantsApi.endLease(tenantId);
      await reload();
      setEndingLease(false);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to end lease")
          : "Failed to end lease"
      );
    } finally {
      setEndLeaseBusy(false);
    }
  }

  async function onDelete() {
    setDeleteBusy(true);
    try {
      await tenantsApi.remove(tenantId);
      navigate("/admin/tenants", { replace: true });
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to delete tenant")
          : "Failed to delete tenant"
      );
      setDeleteBusy(false);
    }
  }

  if (!Number.isFinite(tenantId) || tenantId <= 0) {
    return <div className="text-sm text-red-600">Invalid tenant id.</div>;
  }

  const allLeases = tenant?.leases ?? [];
  const lease = allLeases.find((l) => l.status === "ACTIVE") ?? null;
  const history = allLeases.filter((l) => l.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/tenants" className="text-sm text-slate-600 hover:underline">
          ← Back to tenants
        </Link>
        {tenant && (
          <div className="space-x-2">
            <button
              onClick={() => setEditOpen(true)}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-ink-muted hover:bg-gray-100"
            >
              Edit profile
            </button>
            <button
              onClick={() => setDeleting(true)}
              className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50"
            >
              Delete tenant
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !tenant ? (
        <div className="text-sm text-ink-soft">Loading…</div>
      ) : tenant ? (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <h2 className="text-3xl font-semibold text-ink tracking-tight">{tenant.user.fullName}</h2>
            <p className="text-sm text-ink-muted mt-1.5">{tenant.user.email}</p>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Phone">{tenant.phone ?? "—"}</Row>
              <Row label="National ID">{tenant.nationalId ?? "—"}</Row>
              <Row label="Emergency contact">{tenant.emergencyContact ?? "—"}</Row>
              <Row label="Account">
                {tenant.user.isActive ? "Active" : "Disabled"} ·{" "}
                {new Date(tenant.user.createdAt).toLocaleDateString()}
              </Row>
            </dl>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Current assignment</h3>
              {lease ? (
                <button
                  onClick={() => setEndingLease(true)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-ink-muted hover:bg-gray-100"
                >
                  End lease
                </button>
              ) : (
                <button
                  onClick={() => setAssignOpen(true)}
                  className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600"
                >
                  Assign to unit
                </button>
              )}
            </div>

            {lease ? (
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Row label="Property">{lease.unit?.property?.name ?? "—"}</Row>
                <Row label="Unit">{lease.unit?.label ?? "—"}</Row>
                <Row label="Started">
                  {lease.startDate ? new Date(lease.startDate).toLocaleDateString() : "—"}
                </Row>
                <Row label="Monthly rent">
                  {Number(lease.monthlyRent).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Row>
                <Row label="Lease">
                  <Link
                    to={`/admin/leases/${lease.id}`}
                    className="text-slate-900 hover:underline"
                  >
                    #{lease.id}
                  </Link>
                </Row>
              </dl>
            ) : (
              <p className="text-sm text-ink-soft mt-3">
                This tenant is not currently assigned to a unit.
              </p>
            )}
          </div>

          {paymentsView && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Payments &amp; balance</h3>
                <button
                  onClick={() => setPaymentOpen(true)}
                  disabled={!lease}
                  title={!lease ? "Tenant must have an active lease" : undefined}
                  className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  + Record payment
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SmallStat label="Total billed">
                  {Number(paymentsView.summary.totalBilled).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </SmallStat>
                <SmallStat label="Total paid">
                  {Number(paymentsView.summary.totalPaid).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </SmallStat>
                <SmallStat
                  label="Outstanding"
                  emphasis={Number(paymentsView.summary.outstanding) > 0 ? "danger" : "ok"}
                >
                  {Number(paymentsView.summary.outstanding).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </SmallStat>
              </div>

              {paymentsView.payments.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">No payments recorded yet.</p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-soft">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Paid on</th>
                        <th className="px-4 py-2 text-left font-medium">Method</th>
                        <th className="px-4 py-2 text-left font-medium">Reference</th>
                        <th className="px-4 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {paymentsView.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-ink-muted">
                            {new Date(p.paidAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            <PaymentMethodBadge method={p.method} />
                          </td>
                          <td className="px-4 py-2 text-ink-muted">{p.reference ?? "—"}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">
                            {Number(p.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Lease history</h3>
              <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Lease</th>
                      <th className="px-4 py-2 text-left font-medium">Unit</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Started</th>
                      <th className="px-4 py-2 text-left font-medium">Ended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-sm">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Link
                            to={`/admin/leases/${h.id}`}
                            className="text-slate-900 hover:underline"
                          >
                            #{h.id}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-ink-muted">
                          {h.unit?.property?.name ?? "—"} · {h.unit?.label ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <LeaseStatusBadge status={h.status} />
                        </td>
                        <td className="px-4 py-2 text-ink-soft">
                          {h.startDate ? new Date(h.startDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2 text-ink-soft">
                          {h.endDate ? new Date(h.endDate).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}

      <TenantFormModal
        open={editOpen}
        initial={tenant}
        onClose={() => setEditOpen(false)}
        onSaved={(t) => setTenant(t)}
      />

      <AssignLeaseModal
        open={assignOpen}
        tenantId={tenantId}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => reload()}
      />

      <PaymentFormModal
        open={paymentOpen}
        lockedLeaseId={lease?.id}
        onClose={() => setPaymentOpen(false)}
        onSaved={() => reload()}
      />

      <ConfirmDialog
        open={endingLease}
        title="End lease"
        message="End the current lease? The unit will become available again."
        confirmLabel="End lease"
        onCancel={() => setEndingLease(false)}
        onConfirm={onEndLease}
        busy={endLeaseBusy}
      />

      <ConfirmDialog
        open={deleting}
        title="Delete tenant"
        message="Delete this tenant? Any active lease will be ended and the login account will be removed. This cannot be undone."
        onCancel={() => setDeleting(false)}
        onConfirm={onDelete}
        busy={deleteBusy}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </>
  );
}

function SmallStat({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: "ok" | "danger";
}) {
  const valueClass =
    emphasis === "danger"
      ? "text-red-700"
      : emphasis === "ok"
        ? "text-emerald-700"
        : "text-gray-900";
  return (
    <div className="rounded-md border border-gray-200 p-3">
      <div className="text-xs uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`text-lg font-semibold mt-1 ${valueClass}`}>{children}</div>
    </div>
  );
}
