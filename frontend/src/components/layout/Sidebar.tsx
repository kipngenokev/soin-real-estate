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
    <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-800">
        <h1 className="text-lg font-semibold tracking-tight">Soinsync</h1>
        <p className="text-xs text-slate-400">
          {user.role === "ADMIN" ? "Admin Console" : "Tenant Portal"}
        </p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin" || item.to === "/portal"}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
        v0.1.0 · MVP
      </div>
    </aside>
  );
}
