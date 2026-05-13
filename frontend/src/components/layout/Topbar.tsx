import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const initial = user?.fullName?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm font-medium text-gray-700">
        {user?.role === "ADMIN" ? "Admin" : "Tenant"} · {user?.fullName}
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="h-8 w-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-xs font-semibold text-slate-700"
          aria-label="account menu"
        >
          {initial}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md z-10">
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
              {user?.email}
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
