import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { tenantsApi } from "../../lib/api/tenants";
import { unitsApi } from "../../lib/api/units";
import { leasesApi } from "../../lib/api/leases";
import type { LeaseDetail, Tenant, UnitWithProperty } from "../../lib/types";

type Props = {
  open: boolean;
  /** If set, the tenant selector is pre-filled and disabled. */
  lockedTenantId?: number;
  onClose: () => void;
  onCreated: (lease: LeaseDetail) => void;
};

export function LeaseFormModal({ open, lockedTenantId, onClose, onCreated }: Props) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<UnitWithProperty[]>([]);
  const [tenantId, setTenantId] = useState<number | "">("");
  const [unitId, setUnitId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTenantId(lockedTenantId ?? "");
    setUnitId("");
    setLoading(true);
    (async () => {
      try {
        const [ts, us] = await Promise.all([
          lockedTenantId ? Promise.resolve<Tenant[]>([]) : tenantsApi.list(),
          unitsApi.listAll({ status: "AVAILABLE" }),
        ]);
        setTenants(ts);
        setUnits(us);
      } catch (err) {
        setError(
          err instanceof AxiosError
            ? (err.response?.data?.message ?? "Failed to load form data")
            : "Failed to load form data"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [open, lockedTenantId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantId || !unitId) return;
    setSubmitting(true);
    setError(null);
    try {
      const lease = await leasesApi.create({
        tenantId: Number(tenantId),
        unitId: Number(unitId),
      });
      onCreated(lease);
      onClose();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to create lease")
          : "Failed to create lease"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New lease"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lease-form"
            disabled={submitting || !tenantId || !unitId}
            className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create lease"}
          </button>
        </>
      }
    >
      <form id="lease-form" onSubmit={onSubmit} className="space-y-4">
        {!lockedTenantId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={loading}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            >
              <option value="">
                {loading
                  ? "Loading…"
                  : tenants.length === 0
                    ? "No tenants — create one first"
                    : "Select a tenant…"}
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.fullName} · {t.user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Available unit</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={loading}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          >
            <option value="">
              {loading
                ? "Loading…"
                : units.length === 0
                  ? "No available units"
                  : "Select a unit…"}
            </option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.property?.name ?? `Property #${u.propertyId}`} · {u.label} ·{" "}
                {u.type === "STUDIO" ? "Studio" : "One bedroom"} ·{" "}
                {Number(u.rentAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The lease is created as <strong>DRAFT</strong>. Activate it from the lease detail
            page to mark the unit occupied.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
