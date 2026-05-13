import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { unitsApi, type UnitInput } from "../../lib/api/units";
import type { Unit, UnitStatus, UnitType } from "../../lib/types";

type Props = {
  open: boolean;
  propertyId: number;
  initial?: Unit | null;
  onClose: () => void;
  onSaved: (unit: Unit) => void;
};

type FormState = {
  label: string;
  type: UnitType;
  rentAmount: string;
  status: UnitStatus;
};

const empty: FormState = {
  label: "",
  type: "STUDIO",
  rentAmount: "",
  status: "AVAILABLE",
};

export function UnitFormModal({ open, propertyId, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              label: initial.label,
              type: initial.type,
              rentAmount: String(initial.rentAmount),
              status: initial.status,
            }
          : empty
      );
      setError(null);
    }
  }, [open, initial]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const rent = Number(form.rentAmount);
      if (!Number.isFinite(rent) || rent < 0) {
        throw new Error("Rent amount must be a non-negative number");
      }
      const payload: UnitInput = {
        label: form.label.trim(),
        type: form.type,
        rentAmount: rent,
        status: form.status,
      };
      const saved = initial
        ? await unitsApi.update(initial.id, payload)
        : await unitsApi.create(propertyId, payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to save unit")
          : err instanceof Error
            ? err.message
            : "Failed to save unit";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit unit" : "New unit"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-ink-muted hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="unit-form"
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Saving…" : initial ? "Save changes" : "Create unit"}
          </button>
        </>
      }
    >
      <form id="unit-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-muted">Label</label>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. A1"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink-muted">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as UnitType })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="STUDIO">Studio</option>
              <option value="ONE_BEDROOM">One bedroom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as UnitStatus })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-muted">Rent amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.rentAmount}
            onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
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
