import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ADMIN_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/properties": "Properties",
  "/admin/tenants": "Tenants",
  "/admin/leases": "Leases",
  "/admin/payments": "Payments",
  "/admin/issues": "Issues",
};

const TENANT_TITLES: Record<string, string> = {
  "/portal": "Overview",
  "/portal/lease": "My Lease",
  "/portal/payments": "My Payments",
  "/portal/maintenance": "Maintenance",
};

function titleFor(pathname: string, role: "ADMIN" | "TENANT" | undefined) {
  if (role === "TENANT") {
    return TENANT_TITLES[pathname] ?? "Soinsync";
  }
  // Try exact match, then prefix match (e.g. /admin/tenants/12 → Tenants)
  if (ADMIN_TITLES[pathname]) return ADMIN_TITLES[pathname];
  const prefix = Object.keys(ADMIN_TITLES).find(
    (k) => k !== "/admin" && pathname.startsWith(k + "/")
  );
  return prefix ? ADMIN_TITLES[prefix] : "Dashboard";
}

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function onLogout() {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const initial = user?.fullName?.[0]?.toUpperCase() ?? "U";
  const title = titleFor(location.pathname, user?.role);
  const roleLabel = user?.role === "ADMIN" ? "Admin" : "Tenant";

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-soft font-semibold">
          {roleLabel}
        </div>
        <div className="text-[15px] font-semibold text-ink leading-tight">{title}</div>
      </div>

      <div className="flex items-center gap-3" ref={menuRef}>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-ink-soft">Signed in as</span>
          <span className="font-medium text-ink">{user?.fullName ?? "—"}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 w-9 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold transition-colors border border-brand-100"
            aria-label="account menu"
          >
            {initial}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lift z-20 overflow-hidden">
              <div className="px-3 py-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-ink truncate">
                  {user?.fullName}
                </div>
                <div className="text-xs text-ink-soft truncate">{user?.email}</div>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2.5 text-sm text-ink hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
