import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { tenantsApi, type CreateTenantInput, type UpdateTenantInput } from "../../lib/api/tenants";
import type { Tenant } from "../../lib/types";

type Props = {
  open: boolean;
  initial?: Tenant | null;
  onClose: () => void;
  onSaved: (tenant: Tenant) => void;
};

type FormState = {
  email: string;
  fullName: string;
  password: string;
  phone: string;
  nationalId: string;
  emergencyContact: string;
};

const empty: FormState = {
  email: "",
  fullName: "",
  password: "",
  phone: "",
  nationalId: "",
  emergencyContact: "",
};

export function TenantFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              email: initial.user.email,
              fullName: initial.user.fullName,
              password: "",
              phone: initial.phone ?? "",
              nationalId: initial.nationalId ?? "",
              emergencyContact: initial.emergencyContact ?? "",
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
      let saved: Tenant;
      if (initial) {
        const payload: UpdateTenantInput = {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || null,
          nationalId: form.nationalId.trim() || null,
          emergencyContact: form.emergencyContact.trim() || null,
        };
        saved = await tenantsApi.update(initial.id, payload);
      } else {
        const payload: CreateTenantInput = {
          email: form.email.trim().toLowerCase(),
          fullName: form.fullName.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          nationalId: form.nationalId.trim() || null,
          emergencyContact: form.emergencyContact.trim() || null,
        };
        saved = await tenantsApi.create(payload);
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to save tenant")
          : "Failed to save tenant"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit tenant" : "New tenant"}
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
            form="tenant-form"
            disabled={submitting}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create tenant"}
          </button>
        </>
      }
    >
      <form id="tenant-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={isEdit}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:bg-gray-100"
            />
          </Field>
        </div>

        {!isEdit && (
          <Field label="Temporary password" required>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Share this with the tenant. They will use it to sign in.
            </p>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </Field>
          <Field label="National ID">
            <input
              value={form.nationalId}
              onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </Field>
        </div>

        <Field label="Emergency contact">
          <input
            value={form.emergencyContact}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            placeholder="Name and phone"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </Field>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
