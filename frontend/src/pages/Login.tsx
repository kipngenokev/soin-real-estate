import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";

type LocationState = { from?: string } | null;
type RoleTab = "TENANT" | "ADMIN";

const COPY: Record<RoleTab, { heading: string; subtitle: string; emailPlaceholder: string }> = {
  TENANT: {
    heading: "Tenant sign in",
    subtitle: "View your lease, payments and submit maintenance requests.",
    emailPlaceholder: "you@example.com",
  },
  ADMIN: {
    heading: "Admin sign in",
    subtitle: "Manage properties, tenants and finances.",
    emailPlaceholder: "admin@yourcompany.com",
  },
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state as LocationState;

  const [tab, setTab] = useState<RoleTab>("TENANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copy = COPY[tab];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const destination =
        fromState?.from && fromState.from !== "/login"
          ? fromState.from
          : user.role === "ADMIN"
            ? "/admin"
            : "/portal";
      navigate(destination, { replace: true });
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Login failed")
          : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Soinsync Real Estate</h1>
        <p className="text-xs text-gray-500 mt-1">Rental management</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 border-b border-gray-200" role="tablist">
          {(["TENANT", "ADMIN"] as const).map((role) => {
            const active = tab === role;
            return (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(role);
                  setError(null);
                }}
                className={`py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-slate-900 border-b-2 border-slate-900"
                    : "bg-gray-50 text-gray-500 hover:text-gray-700"
                }`}
              >
                {role === "TENANT" ? "I'm a tenant" : "I'm an admin"}
              </button>
            );
          })}
        </div>

        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900">{copy.heading}</h2>
          <p className="text-sm text-gray-500 mt-1">{copy.subtitle}</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder={copy.emailPlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {tab === "TENANT" && (
            <p className="text-xs text-gray-400 mt-6 text-center">
              New tenants are onboarded by an administrator. Contact your landlord
              if you need access.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
