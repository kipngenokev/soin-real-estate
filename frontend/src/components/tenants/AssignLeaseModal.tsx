import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { propertiesApi } from "../../lib/api/properties";
import { unitsApi } from "../../lib/api/units";
import { tenantsApi } from "../../lib/api/tenants";
import type { LeaseWithUnit, Property, Unit } from "../../lib/types";

type Props = {
  open: boolean;
  tenantId: number;
  onClose: () => void;
  onAssigned: (lease: LeaseWithUnit) => void;
};

type Option = {
  unitId: number;
  label: string;
};

export function AssignLeaseModal({ open, tenantId, onClose, onAssigned }: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedUnitId("");
    setLoading(true);
    (async () => {
      try {
        const properties = await propertiesApi.list();
        const lists = await Promise.all(
          properties.map(async (p: Property) => {
            const units = await unitsApi.listForProperty(p.id);
            return units
              .filter((u: Unit) => u.status === "AVAILABLE")
              .map<Option>((u) => ({
                unitId: u.id,
                label: `${p.name} · ${u.label} · ${
                  u.type === "STUDIO" ? "Studio" : "One bedroom"
                } · ${Number(u.rentAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
              }));
          })
        );
        setOptions(lists.flat());
      } catch (err) {
        setError(
          err instanceof AxiosError
            ? (err.response?.data?.message ?? "Failed to load available units")
            : "Failed to load available units"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedUnitId) return;
    setSubmitting(true);
    setError(null);
    try {
      const lease = await tenantsApi.assignLease(tenantId, Number(selectedUnitId));
      onAssigned(lease);
      onClose();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to assign lease")
          : "Failed to assign lease"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign tenant to a unit"
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
            form="assign-lease-form"
            disabled={submitting || !selectedUnitId}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Assigning…" : "Assign"}
          </button>
        </>
      }
    >
      <form id="assign-lease-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Available units</label>
          <select
            value={selectedUnitId}
            onChange={(e) =>
              setSelectedUnitId(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={loading}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">
              {loading ? "Loading…" : options.length === 0 ? "No available units" : "Select a unit…"}
            </option>
            {options.map((opt) => (
              <option key={opt.unitId} value={opt.unitId}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Monthly rent will be captured from the unit at assignment time.
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
