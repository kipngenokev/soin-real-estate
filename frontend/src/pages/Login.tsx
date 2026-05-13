import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";

type LocationState = { from?: string } | null;
type RoleTab = "TENANT" | "ADMIN";

const COPY: Record<RoleTab, { heading: string; subtitle: string; emailPlaceholder: string }> = {
  TENANT: {
    heading: "Welcome back",
    subtitle: "View your lease, payments and submit maintenance requests.",
    emailPlaceholder: "you@example.com",
  },
  ADMIN: {
    heading: "Sign in",
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
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image — full bleed */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-hero.jpg')" }}
        aria-hidden="true"
      />
      {/* Dark gradient overlay for legibility + drama */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-900/40 to-slate-950/70"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <main className="w-full max-w-md">
          {/* Floating glass card */}
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-slate-950/40 overflow-hidden">
            {/* Brand + welcome header */}
            <div className="px-7 sm:px-8 pt-7 sm:pt-8 pb-5 text-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center font-semibold">
                  S
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">Soinsync</div>
                  <div className="text-[11px] text-white/70 -mt-0.5">Real Estate</div>
                </div>
              </div>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight">{copy.heading}</h1>
              <p className="mt-1 text-sm text-white/75">{copy.subtitle}</p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 border-y border-white/15" role="tablist">
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
                    className={`py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-white/10 text-white border-b-2 border-white"
                        : "text-white/60 hover:text-white/90 border-b-2 border-transparent"
                    }`}
                  >
                    {role === "TENANT" ? "I'm a tenant" : "I'm an admin"}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <div className="px-7 sm:px-8 py-7 sm:py-8">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="block text-xs font-medium text-white/80 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className="mt-1.5 w-full rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/80 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 w-full rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 transition-colors"
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-red-300/40 bg-red-500/15 backdrop-blur-sm px-3 py-2 text-sm text-red-50">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-white text-slate-900 py-2.5 text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition-colors shadow-md shadow-slate-950/20"
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              {tab === "TENANT" && (
                <p className="text-xs text-white/60 mt-6 text-center">
                  New tenants are onboarded by an administrator.
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/60">
            © {new Date().getFullYear()} Soinsync Real Estate
          </p>
        </main>
      </div>
    </div>
  );
}
