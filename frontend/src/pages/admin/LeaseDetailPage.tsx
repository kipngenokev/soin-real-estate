import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { leasesApi } from "../../lib/api/leases";
import type { LeaseDetail } from "../../lib/types";
import { LeaseStatusBadge } from "../../components/leases/LeaseStatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/PageHeader";

export function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leaseId = Number(id);
  const navigate = useNavigate();

  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [endingOpen, setEndingOpen] = useState(false);
  const [endingBusy, setEndingBusy] = useState(false);
  const [deletingOpen, setDeletingOpen] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);

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

  async function onActivate() {
    setActivating(true);
    setError(null);
    try {
      const updated = await leasesApi.activate(leaseId);
      setLease(updated);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to activate lease")
          : "Failed to activate lease"
      );
    } finally {
      setActivating(false);
    }
  }

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

  async function onDelete() {
    setDeletingBusy(true);
    try {
      await leasesApi.remove(leaseId);
      navigate("/admin/leases", { replace: true });
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to delete lease")
          : "Failed to delete lease"
      );
      setDeletingBusy(false);
    }
  }

  if (!Number.isFinite(leaseId) || leaseId <= 0) {
    return <div className="text-sm text-red-600">Invalid lease id.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/leases" className="text-sm text-ink-muted hover:text-brand-600">
          ← Back to leases
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !lease ? (
        <div className="text-sm text-ink-soft">Loading…</div>
      ) : lease ? (
        <>
          <PageHeader
            eyebrow="Lease"
            title={`Lease #${lease.id}`}
            subtitle={`Created ${new Date(lease.createdAt).toLocaleDateString()}`}
            actions={
              <div className="flex items-center gap-2">
                <LeaseStatusBadge status={lease.status} />
                {lease.status === "DRAFT" && (
                  <>
                    <button
                      onClick={onActivate}
                      disabled={activating}
                      className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {activating ? "Activating…" : "Activate"}
                    </button>
                    <button onClick={() => setDeletingOpen(true)} className="btn-danger">
                      Delete draft
                    </button>
                  </>
                )}
                {lease.status === "ACTIVE" && (
                  <button onClick={() => setEndingOpen(true)} className="btn-ghost">
                    End lease
                  </button>
                )}
              </div>
            }
          />

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Tenant">
                {lease.tenant ? (
                  <Link
                    to={`/admin/tenants/${lease.tenantId}`}
                    className="text-ink hover:text-brand-600 hover:underline"
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
                    className="text-ink hover:text-brand-600 hover:underline"
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
        <div className="text-sm text-ink-soft">Lease not found.</div>
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

      <ConfirmDialog
        open={deletingOpen}
        title="Delete draft lease"
        message="Delete this draft lease? This cannot be undone."
        onCancel={() => setDeletingOpen(false)}
        onConfirm={onDelete}
        busy={deletingBusy}
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
