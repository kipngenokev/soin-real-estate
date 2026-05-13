import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { tenantsApi } from "../../lib/api/tenants";
import type { Tenant } from "../../lib/types";
import { TenantFormModal } from "../../components/tenants/TenantFormModal";
import { AssignLeaseModal } from "../../components/tenants/AssignLeaseModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LeaseStatusBadge } from "../../components/leases/LeaseStatusBadge";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = Number(id);
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [endingLease, setEndingLease] = useState(false);
  const [endLeaseBusy, setEndLeaseBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTenant(await tenantsApi.get(tenantId));
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
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
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
        <div className="text-sm text-gray-500">Loading…</div>
      ) : tenant ? (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">{tenant.user.fullName}</h2>
            <p className="text-sm text-gray-500 mt-1">{tenant.user.email}</p>

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
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  End lease
                </button>
              ) : (
                <button
                  onClick={() => setAssignOpen(true)}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800"
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
              <p className="text-sm text-gray-500 mt-3">
                This tenant is not currently assigned to a unit.
              </p>
            )}
          </div>

          {history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Lease history</h3>
              <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
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
                        <td className="px-4 py-2 text-gray-700">
                          {h.unit?.property?.name ?? "—"} · {h.unit?.label ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <LeaseStatusBadge status={h.status} />
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {h.startDate ? new Date(h.startDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
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
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </>
  );
}
