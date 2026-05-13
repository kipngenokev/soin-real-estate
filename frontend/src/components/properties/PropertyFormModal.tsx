import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import {
  propertiesApi,
  type PropertyInput,
  type PropertyUpdateInput,
  type UnitGroupInput,
} from "../../lib/api/properties";
import type { Property, UnitType } from "../../lib/types";

type Props = {
  open: boolean;
  initial?: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
};

type UnitGroupForm = {
  type: UnitType;
  label: string;
  count: string;
  rentAmount: string;
};

const emptyGroups: UnitGroupForm[] = [
  { type: "STUDIO", label: "Studio", count: "0", rentAmount: "" },
  { type: "ONE_BEDROOM", label: "One bedroom", count: "0", rentAmount: "" },
];

const emptyForm = {
  name: "",
  location: "",
  description: "",
};

export function PropertyFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [groups, setGroups] = useState<UnitGroupForm[]>(emptyGroups);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              location: initial.location,
              description: initial.description ?? "",
            }
          : emptyForm
      );
      setGroups(emptyGroups.map((g) => ({ ...g })));
      setError(null);
    }
  }, [open, initial]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (initial) {
        const payload: PropertyUpdateInput = {
          name: form.name.trim(),
          location: form.location.trim(),
          description: form.description.trim() || null,
        };
        const saved = await propertiesApi.update(initial.id, payload);
        onSaved(saved);
        onClose();
        return;
      }

      // Create flow: validate and shape unitGroups.
      const unitGroups: UnitGroupInput[] = [];
      for (const g of groups) {
        const count = Number(g.count || "0");
        if (!Number.isInteger(count) || count < 0) {
          throw new Error(`${g.label}: count must be a whole number ≥ 0`);
        }
        if (count === 0) continue;
        const rent = Number(g.rentAmount);
        if (!Number.isFinite(rent) || rent <= 0) {
          throw new Error(`${g.label}: rent amount is required when count > 0`);
        }
        unitGroups.push({ type: g.type, count, rentAmount: rent });
      }

      const payload: PropertyInput = {
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description.trim() || null,
        unitGroups: unitGroups.length > 0 ? unitGroups : undefined,
      };
      const saved = await propertiesApi.create(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to save property")
          : err instanceof Error
            ? err.message
            : "Failed to save property";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateGroup(idx: number, patch: Partial<UnitGroupForm>) {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  const totalUnits = isEdit
    ? 0
    : groups.reduce((sum, g) => sum + (Number(g.count || "0") || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit property" : "New property"}
      size="lg"
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
            form="property-form"
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : totalUnits > 0
                  ? `Create property + ${totalUnits} unit${totalUnits === 1 ? "" : "s"}`
                  : "Create property"}
          </button>
        </>
      }
    >
      <form id="property-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        {!isEdit && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-baseline justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Units in this property</h4>
              <span className="text-xs text-gray-500">
                Leave as 0 to add units later.
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Each unit is auto-labelled (Studios become <code>S1, S2…</code>; one-bedrooms become{" "}
              <code>B1, B2…</code>) and starts as <strong>Available</strong>.
            </p>

            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
                <div className="col-span-5">Type</div>
                <div className="col-span-3">How many</div>
                <div className="col-span-4">Monthly rent</div>
              </div>
              {groups.map((g, idx) => (
                <div key={g.type} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 text-sm text-gray-900">{g.label}</div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={g.count}
                      onChange={(e) => updateGroup(idx, { count: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={Number(g.count || "0") > 0 ? "required" : "—"}
                      value={g.rentAmount}
                      onChange={(e) => updateGroup(idx, { rentAmount: e.target.value })}
                      disabled={Number(g.count || "0") <= 0}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
