import { NavLink } from "react-router-dom";
import { useAuth, type Role } from "../../context/AuthContext";

type NavItem = { to: string; label: string; roles: Role[] };

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", roles: ["ADMIN"] },
  { to: "/admin/properties", label: "Properties", roles: ["ADMIN"] },
  { to: "/admin/tenants", label: "Tenants", roles: ["ADMIN"] },
  { to: "/admin/leases", label: "Leases", roles: ["ADMIN"] },
  { to: "/admin/payments", label: "Payments", roles: ["ADMIN"] },
  { to: "/admin/issues", label: "Issues", roles: ["ADMIN"] },
  { to: "/portal", label: "Overview", roles: ["TENANT"] },
  { to: "/portal/lease", label: "My Lease", roles: ["TENANT"] },
  { to: "/portal/payments", label: "My Payments", roles: ["TENANT"] },
  { to: "/portal/maintenance", label: "Maintenance", roles: ["TENANT"] },
];

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const items = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md flex items-center justify-center text-[13px] font-bold text-white"
               style={{ backgroundColor: "#0a0a0a" }}>
            S
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink">Soinsync</div>
            <div className="text-[11px] text-ink-soft">Real Estate</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-px">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/portal"}
            className={({ isActive }) =>
              `relative flex items-center px-3 py-2 text-[13.5px] rounded-md transition-colors ${
                isActive
                  ? "text-ink font-semibold bg-gray-50"
                  : "text-ink-muted hover:text-ink hover:bg-gray-50/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r bg-brand-500"
                  />
                )}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-3 text-[10.5px] text-ink-soft border-t border-gray-100">
        v0.1.0 · MVP
      </div>
    </aside>
  );
}
