import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { RoleGuard } from "@/components/auth/RoleGuard";

// Layouts
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { FocusLayout } from "@/layouts/FocusLayout";

// Pages - Auth (eager — lightweight)
import { HouseSelectPage } from "@/pages/auth/HouseSelectPage";
import { UserLoginPage } from "@/pages/auth/UserLoginPage";

// Pages - Auth (lazy — onboarding)
const ActivateAccountPage = lazy(() =>
  import("@/pages/auth/ActivateAccountPage").then((m) => ({
    default: m.ActivateAccountPage,
  })),
);
const SelfRegisterPage = lazy(() =>
  import("@/pages/auth/SelfRegisterPage").then((m) => ({
    default: m.SelfRegisterPage,
  })),
);
const PendingApprovalPage = lazy(() =>
  import("@/pages/auth/PendingApprovalPage").then((m) => ({
    default: m.PendingApprovalPage,
  })),
);

// Pages - App (lazy loaded)
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const TasksPage = lazy(() => import("@/pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const FinancePage = lazy(() =>
  import("@/pages/FinancePage").then((m) => ({ default: m.FinancePage })),
);
const CommunicationPage = lazy(() =>
  import("@/pages/CommunicationPage").then((m) => ({ default: m.CommunicationPage })),
);
const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const HealthPage = lazy(() =>
  import("@/pages/HealthPage").then((m) => ({ default: m.HealthPage })),
);
const SecurityPage = lazy(() =>
  import("@/pages/SecurityPage").then((m) => ({ default: m.SecurityPage })),
);
const AdminPage = lazy(() =>
  import("@/pages/admin/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const HouseMembersPage = lazy(() =>
  import("@/pages/settings/HouseMembersPage").then((m) => ({
    default: m.HouseMembersPage,
  })),
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
          <Route path="/auth/activate" element={<ActivateAccountPage />} />
          <Route path="/auth/register" element={<SelfRegisterPage />} />
          <Route path="/auth/pending" element={<PendingApprovalPage />} />
        </Route>

        {/* ── App (requiere autenticación) ─────── */}
        <Route element={<ProtectedRoute />}>
          {/* Layout adaptativo: Focus para simplified, normal para el resto */}
          <Route element={<AdaptiveLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tareas" element={<TasksPage />} />
            <Route path="/comunicacion" element={<CommunicationPage />} />
            <Route
              path="/finanzas"
              element={
                <RoleGuard minRole="simplified" redirectTo="/dashboard">
                  <FinancePage />
                </RoleGuard>
              }
            />
            <Route
              path="/calendario"
              element={
                <RoleGuard minRole="simplified" redirectTo="/dashboard">
                  <CalendarPage />
                </RoleGuard>
              }
            />
            <Route
              path="/salud"
              element={
                <RoleGuard minRole="simplified" redirectTo="/dashboard">
                  <HealthPage />
                </RoleGuard>
              }
            />
            <Route
              path="/seguridad"
              element={
                <RoleGuard minRole="member" redirectTo="/dashboard">
                  <SecurityPage />
                </RoleGuard>
              }
            />

            {/* ── Admin (solo admin) ───────────── */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard">
                  <AdminPage />
                </RoleGuard>
              }
            />

            {/* ── Settings (todos) ─────────────── */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/settings/members"
              element={
                <RoleGuard minRole="responsible" redirectTo="/settings">
                  <HouseMembersPage />
                </RoleGuard>
              }
            />
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

/** Elige layout según el perfil: FocusLayout para simplified, AppLayout para el resto */
function AdaptiveLayout() {
  const { isFocusMode, isSimplified, isExternal } = usePermissions();

  if (isFocusMode || isSimplified || isExternal) {
    return <FocusLayout />;
  }

  return <AppLayout />;
}
