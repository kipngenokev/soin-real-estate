import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type Role } from "../../context/AuthContext";

type Props = {
  roles?: Role[];
};

export function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === "ADMIN" ? "/admin" : "/portal";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
