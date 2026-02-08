import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

// Layouts
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";

// Pages - Auth
import { HouseSelectPage } from "@/pages/auth/HouseSelectPage";
import { UserLoginPage } from "@/pages/auth/UserLoginPage";

// Pages - App
import { DashboardPage } from "@/pages/DashboardPage";
import { TasksPage } from "@/pages/TasksPage";
import { FinancePage } from "@/pages/FinancePage";

export function App() {
  return (
    <Routes>
      {/* ── Auth (sin autenticación) ─────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/house" element={<HouseSelectPage />} />
        <Route path="/auth/login" element={<UserLoginPage />} />
      </Route>

      {/* ── App (requiere autenticación) ─────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tareas" element={<TasksPage />} />
          <Route path="/finanzas" element={<FinancePage />} />
        </Route>
      </Route>

      {/* ── Redirect ─────────────────────────── */}
      <Route path="*" element={<Navigate to="/auth/house" replace />} />
    </Routes>
  );
}

/** Redirige a login si no está autenticado */
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/house" replace />;
  }

  return <Outlet />;
}
