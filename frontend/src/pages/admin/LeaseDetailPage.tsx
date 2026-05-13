import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { leasesApi } from "../../lib/api/leases";
import type { LeaseDetail } from "../../lib/types";
import { LeaseStatusBadge } from "../../components/leases/LeaseStatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

export function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leaseId = Number(id);

  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endingOpen, setEndingOpen] = useState(false);
  const [endingBusy, setEndingBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLease(await leasesApi.get(leaseId));
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load lease")
          : "Failed to load lease"
      );
    } finally {
      setLoading(false);
    }
  }, [leaseId]);

  useEffect(() => {
    if (Number.isFinite(leaseId) && leaseId > 0) reload();
  }, [leaseId, reload]);

  async function onEnd() {
    setEndingBusy(true);
    setError(null);
    try {
      const updated = await leasesApi.end(leaseId);
      setLease(updated);
      setEndingOpen(false);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to end lease")
          : "Failed to end lease"
      );
    } finally {
      setEndingBusy(false);
    }
  }

  if (!Number.isFinite(leaseId) || leaseId <= 0) {
    return <div className="text-sm text-red-600">Invalid lease id.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/leases" className="text-sm text-slate-600 hover:underline">
          ← Back to leases
        </Link>
        {lease && lease.status === "ACTIVE" && (
          <button
            onClick={() => setEndingOpen(true)}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            End lease
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !lease ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : lease ? (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Lease #{lease.id}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Created {new Date(lease.createdAt).toLocaleDateString()}
                </p>
              </div>
              <LeaseStatusBadge status={lease.status} />
            </div>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Tenant">
                {lease.tenant ? (
                  <Link
                    to={`/admin/tenants/${lease.tenantId}`}
                    className="text-slate-900 hover:underline"
                  >
                    {lease.tenant.user.fullName}
                  </Link>
                ) : (
                  `#${lease.tenantId}`
                )}
              </Row>
              <Row label="Email">{lease.tenant?.user?.email ?? "—"}</Row>
              <Row label="Property">
                {lease.unit?.property ? (
                  <Link
                    to={`/admin/properties/${lease.unit.propertyId}`}
                    className="text-slate-900 hover:underline"
                  >
                    {lease.unit.property.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Unit">{lease.unit?.label ?? "—"}</Row>
              <Row label="Monthly rent">
                {Number(lease.monthlyRent).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Row>
              <Row label="Started">
                {lease.startDate ? new Date(lease.startDate).toLocaleDateString() : "—"}
              </Row>
              <Row label="Ended">
                {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : "—"}
              </Row>
            </dl>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500">Lease not found.</div>
      )}

      <ConfirmDialog
        open={endingOpen}
        title="End lease"
        message="End this lease? The unit will become available again."
        confirmLabel="End lease"
        onCancel={() => setEndingOpen(false)}
        onConfirm={onEnd}
        busy={endingBusy}
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
