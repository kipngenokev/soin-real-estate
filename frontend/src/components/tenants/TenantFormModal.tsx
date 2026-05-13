import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { tenantsApi, type CreateTenantInput, type UpdateTenantInput } from "../../lib/api/tenants";
import { unitsApi } from "../../lib/api/units";
import type { Tenant, UnitWithProperty } from "../../lib/types";

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
  unitId: number | "";
};

const empty: FormState = {
  email: "",
  fullName: "",
  password: "",
  phone: "",
  nationalId: "",
  emergencyContact: "",
  unitId: "",
};

function fmtMoney(v: string | number) {
  return Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TenantFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [units, setUnits] = useState<UnitWithProperty[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            email: initial.user.email,
            fullName: initial.user.fullName,
            password: "",
            phone: initial.phone ?? "",
            nationalId: initial.nationalId ?? "",
            emergencyContact: initial.emergencyContact ?? "",
            unitId: "",
          }
        : empty
    );
    setError(null);

    // Only fetch units when onboarding a new tenant.
    if (!initial) {
      setUnitsLoading(true);
      unitsApi
        .listAll({ status: "AVAILABLE" })
        .then(setUnits)
        .catch(() => setUnits([]))
        .finally(() => setUnitsLoading(false));
    } else {
      setUnits([]);
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
          unitId: form.unitId === "" ? null : Number(form.unitId),
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

  const buttonLabel = (() => {
    if (submitting) return "Saving…";
    if (isEdit) return "Save changes";
    return form.unitId !== "" ? "Onboard tenant & assign unit" : "Onboard tenant";
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit tenant" : "Onboard tenant"}
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
            className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {buttonLabel}
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
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={isEdit}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 disabled:bg-gray-100"
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
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
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
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </Field>
          <Field label="National ID">
            <input
              value={form.nationalId}
              onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </Field>
        </div>

        <Field label="Emergency contact">
          <input
            value={form.emergencyContact}
            onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            placeholder="Name and phone"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
        </Field>

        {!isEdit && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-baseline justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Unit assignment</h4>
              <span className="text-xs text-gray-500">Optional</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pick a unit to assign now — a lease will be created and activated
              automatically. Leave blank to assign later from the tenant page.
            </p>

            <div className="mt-3">
              <select
                value={form.unitId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unitId: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                disabled={unitsLoading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
              >
                <option value="">
                  {unitsLoading
                    ? "Loading available units…"
                    : units.length === 0
                      ? "No available units — onboard without assignment"
                      : "Don't assign a unit yet"}
                </option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.property?.name ?? `Property #${u.propertyId}`} · {u.label} ·{" "}
                    {u.type === "STUDIO" ? "Studio" : "One bedroom"} · {fmtMoney(u.rentAmount)}
                  </option>
                ))}
              </select>
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
