import { Navigate, Outlet } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

export default function RequireAdmin() {
  const { user, isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  // Pas connecté => login admin
  if (!user) return <Navigate to="/admin/login" replace />;

  // Connecté mais pas admin => page compte (ou home)
  if (!isAdmin) return <Navigate to="/account" replace />;

  return <Outlet />;
}
