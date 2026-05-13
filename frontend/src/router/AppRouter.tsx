import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RoleRedirect } from "../components/auth/RoleRedirect";
import { Login } from "../pages/Login";
import { AdminDashboard } from "../pages/AdminDashboard";
import { TenantPortal } from "../pages/TenantPortal";
import { PropertiesPage } from "../pages/admin/PropertiesPage";
import { PropertyDetailPage } from "../pages/admin/PropertyDetailPage";
import { TenantsPage } from "../pages/admin/TenantsPage";
import { TenantDetailPage } from "../pages/admin/TenantDetailPage";
import { LeasesPage } from "../pages/admin/LeasesPage";
import { LeaseDetailPage } from "../pages/admin/LeaseDetailPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/properties" element={<PropertiesPage />} />
          <Route path="/admin/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/admin/tenants" element={<TenantsPage />} />
          <Route path="/admin/tenants/:id" element={<TenantDetailPage />} />
          <Route path="/admin/leases" element={<LeasesPage />} />
          <Route path="/admin/leases/:id" element={<LeaseDetailPage />} />
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
