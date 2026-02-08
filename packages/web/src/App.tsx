import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

// Layouts
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";

// Pages - Auth (eager — lightweight)
import { HouseSelectPage } from "@/pages/auth/HouseSelectPage";
import { UserLoginPage } from "@/pages/auth/UserLoginPage";

// Pages - App (lazy loaded)
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const TasksPage = lazy(() =>
  import("@/pages/TasksPage").then((m) => ({ default: m.TasksPage }))
);
const FinancePage = lazy(() =>
  import("@/pages/FinancePage").then((m) => ({ default: m.FinancePage }))
);
const CommunicationPage = lazy(() =>
  import("@/pages/CommunicationPage").then((m) => ({ default: m.CommunicationPage }))
);
const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage }))
);
const HealthPage = lazy(() =>
  import("@/pages/HealthPage").then((m) => ({ default: m.HealthPage }))
);
const SecurityPage = lazy(() =>
  import("@/pages/SecurityPage").then((m) => ({ default: m.SecurityPage }))
);

// Spinner de carga para Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
            <Route path="/comunicacion" element={<CommunicationPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/salud" element={<HealthPage />} />
            <Route path="/seguridad" element={<SecurityPage />} />
          </Route>
        </Route>

        {/* ── Redirect ─────────────────────────── */}
        <Route path="*" element={<Navigate to="/auth/house" replace />} />
      </Routes>
    </Suspense>
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
