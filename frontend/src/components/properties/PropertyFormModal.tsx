import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { propertiesApi, type PropertyInput } from "../../lib/api/properties";
import type { Property } from "../../lib/types";

type Props = {
  open: boolean;
  initial?: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
};

const empty: PropertyInput = { name: "", location: "", description: "" };

export function PropertyFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<PropertyInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              location: initial.location,
              description: initial.description ?? "",
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
      const payload: PropertyInput = {
        name: form.name.trim(),
        location: form.location.trim(),
        description: form.description?.toString().trim() || null,
      };
      const saved = initial
        ? await propertiesApi.update(initial.id, payload)
        : await propertiesApi.create(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to save property")
          : "Failed to save property"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit property" : "New property"}
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
            {submitting ? "Saving…" : initial ? "Save changes" : "Create property"}
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
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
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
