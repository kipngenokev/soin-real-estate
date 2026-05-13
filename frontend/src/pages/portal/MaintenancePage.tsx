import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { issuesApi } from "../../lib/api/issues";
import type { Issue, IssueStatus } from "../../lib/types";

export function MaintenancePage() {
  const [items, setItems] = useState<Issue[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await issuesApi.listMine());
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to load your issues")
          : "Failed to load your issues"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!title.trim() || !description.trim()) {
      setFormError("Title and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const created = await issuesApi.createMine({
        title: title.trim(),
        description: description.trim(),
      });
      setItems((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setSuccess("Your issue has been submitted.");
    } catch (err) {
      setFormError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Failed to submit issue")
          : "Failed to submit issue"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Maintenance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Report a problem with your unit. We'll get back to you once it's been looked at.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Report a new issue</h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Leaking kitchen tap"
              maxLength={120}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue with as much detail as you can…"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {formError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-2 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit issue"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">My issues</h3>
        {error && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">You haven't reported any issues yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="border border-gray-200 rounded-md p-3 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{i.title}</div>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                    {i.description}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Reported {new Date(i.createdAt).toLocaleDateString()}
                    {i.resolvedAt && (
                      <> · Resolved {new Date(i.resolvedAt).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  const cls =
    status === "OPEN"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span
      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${cls}`}
    >
      {status === "OPEN" ? "Open" : "Resolved"}
    </span>
  );
}
