import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RoleRedirect } from "../components/auth/RoleRedirect";
import { Login } from "../pages/Login";
import { AdminDashboard } from "../pages/AdminDashboard";
import { TenantPortal } from "../pages/TenantPortal";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/properties" element={<AdminDashboard />} />
          <Route path="/admin/tenants" element={<AdminDashboard />} />
          <Route path="/admin/payments" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Tenant-only routes */}
      <Route element={<ProtectedRoute roles={["TENANT"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/portal" element={<TenantPortal />} />
          <Route path="/portal/lease" element={<TenantPortal />} />
          <Route path="/portal/payments" element={<TenantPortal />} />
          <Route path="/portal/maintenance" element={<TenantPortal />} />
        </Route>
      </Route>

      {/* Root + catch-all: redirect by role (or to /login if unauthenticated) */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
