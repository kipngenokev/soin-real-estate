import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/Modal";
import { leasesApi } from "../../lib/api/leases";
import { paymentsApi } from "../../lib/api/payments";
import type { LeaseDetail, Payment, PaymentMethod } from "../../lib/types";

type Props = {
  open: boolean;
  /** If provided, lease selector is pre-filled and disabled. */
  lockedLeaseId?: number;
  /** If provided, only show leases belonging to this tenant. */
  filterTenantId?: number;
  onClose: () => void;
  onSaved: (payment: Payment) => void;
};

type FormState = {
  leaseId: number | "";
  amount: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  paidAt: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const empty = (lockedLeaseId?: number): FormState => ({
  leaseId: lockedLeaseId ?? "",
  amount: "",
  method: "CASH",
  reference: "",
  note: "",
  paidAt: todayIso(),
});

export function PaymentFormModal({
  open,
  lockedLeaseId,
  filterTenantId,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(empty(lockedLeaseId));
  const [leases, setLeases] = useState<LeaseDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(empty(lockedLeaseId));
    if (lockedLeaseId) {
      setLeases([]);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        // Active leases first; if filtering by tenant, scope the query.
        const items = await leasesApi.list(filterTenantId ? { tenantId: filterTenantId } : {});
        setLeases(items);
      } catch (err) {
        setError(
          err instanceof AxiosError
            ? (err.response?.data?.message ?? "Failed to load leases")
            : "Failed to load leases"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [open, lockedLeaseId, filterTenantId]);

  const sortedLeases = useMemo(() => {
    const order: Record<LeaseDetail["status"], number> = { ACTIVE: 0, DRAFT: 1, ENDED: 2 };
    return [...leases].sort((a, b) => order[a.status] - order[b.status]);
  }, [leases]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.leaseId) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    setSubmitting(true);
    try {
      const saved = await paymentsApi.create({
        leaseId: Number(form.leaseId),
        amount,
        method: form.method,
        reference: form.reference.trim() || null,
        note: form.note.trim() || null,
        paidAt: form.paidAt,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to record payment")
          : "Failed to record payment"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
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
            form="payment-form"
            disabled={submitting || !form.leaseId}
            className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Record payment"}
          </button>
        </>
      }
    >
      <form id="payment-form" onSubmit={onSubmit} className="space-y-4">
        {!lockedLeaseId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Lease</label>
            <select
              value={form.leaseId}
              onChange={(e) =>
                setForm({
                  ...form,
                  leaseId: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              disabled={loading}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            >
              <option value="">
                {loading
                  ? "Loading…"
                  : sortedLeases.length === 0
                    ? "No leases available"
                    : "Select a lease…"}
              </option>
              {sortedLeases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.tenant?.user?.fullName ?? `Tenant #${l.tenantId}`} ·{" "}
                  {l.unit?.property?.name ?? "—"} · {l.unit?.label ?? "—"} · {l.status}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Method</label>
            <select
              value={form.method}
              onChange={(e) =>
                setForm({ ...form, method: e.target.value as PaymentMethod })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="MPESA">M-Pesa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Paid on</label>
            <input
              type="date"
              value={form.paidAt}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference</label>
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Txn ID, M-Pesa code…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
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
