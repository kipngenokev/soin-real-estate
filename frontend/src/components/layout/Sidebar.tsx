import { NavLink } from "react-router-dom";
import { useAuth, type Role } from "../../context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  icon: JSX.Element;
  roles: Role[];
};

const Icon = {
  Dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 21h18" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15 20a5 5 0 0 1 6.5-4.8" />
    </svg>
  ),
  Doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  ),
  Cash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5h.01M18 14.5h.01" />
    </svg>
  ),
  Wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M14.7 6.3a3.5 3.5 0 1 0 4.95 4.95l-.05-.05-9.92 9.92a2.12 2.12 0 1 1-3-3l9.92-9.92z" />
    </svg>
  ),
  Home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V10" />
    </svg>
  ),
};

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: Icon.Dashboard, roles: ["ADMIN"] },
  { to: "/admin/properties", label: "Properties", icon: Icon.Building, roles: ["ADMIN"] },
  { to: "/admin/tenants", label: "Tenants", icon: Icon.Users, roles: ["ADMIN"] },
  { to: "/admin/leases", label: "Leases", icon: Icon.Doc, roles: ["ADMIN"] },
  { to: "/admin/payments", label: "Payments", icon: Icon.Cash, roles: ["ADMIN"] },
  { to: "/admin/issues", label: "Issues", icon: Icon.Wrench, roles: ["ADMIN"] },

  { to: "/portal", label: "Overview", icon: Icon.Home, roles: ["TENANT"] },
  { to: "/portal/lease", label: "My Lease", icon: Icon.Doc, roles: ["TENANT"] },
  { to: "/portal/payments", label: "My Payments", icon: Icon.Cash, roles: ["TENANT"] },
  { to: "/portal/maintenance", label: "Maintenance", icon: Icon.Wrench, roles: ["TENANT"] },
];

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const items = navItems.filter((item) => item.roles.includes(user.role));
  const sectionLabel = user.role === "ADMIN" ? "Admin console" : "Tenant portal";

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold tracking-tight shadow-sm">
            S
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-ink">Soinsync</div>
            <div className="text-[11px] text-ink-soft">Real Estate</div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-4 pb-2">
        <p className="px-3 text-[10px] uppercase tracking-[0.08em] text-ink-soft font-semibold">
          {sectionLabel}
        </p>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/portal"}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-muted hover:bg-gray-50 hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive ? "text-brand-600" : "text-ink-soft group-hover:text-ink-muted"
                  }
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-3 border-t border-gray-100 text-[11px] text-ink-soft">
        v0.1.0 · MVP
      </div>
    </aside>
  );
}
