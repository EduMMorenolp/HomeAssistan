// ══════════════════════════════════════════════
// FocusLayout — Interfaz simplificada
// Para: simplified, external, o profileType=focus
// ══════════════════════════════════════════════

import { Outlet, NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Home,
  LogOut,
} from "lucide-react";

export function FocusLayout() {
  const { user, house, logout } = useAuthStore();
  const { isExternal } = usePermissions();

  // Items de navegación para modo focus (simplificado)
  const focusNavItems = [
    { to: "/dashboard", icon: Home, label: "Inicio", always: true },
    { to: "/tareas", icon: CheckSquare, label: "Tareas", always: true },
    { to: "/comunicacion", icon: MessageSquare, label: "Chat", always: !isExternal },
  ].filter((item) => item.always);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top header — simple */}
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {house?.name?.charAt(0) || "H"}
          </div>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">
            {house?.name || "Mi Casa"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
            {user?.name}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content — más espacioso para facilitar uso */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom navigation — botones grandes estilo app */}
      <nav className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {focusNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px]",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500",
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Botón S.O.S. siempre visible */}
          <NavLink
            to="/comunicacion"
            state={{ panic: true }}
            className="flex flex-col items-center gap-1 px-4 py-2 text-red-500 hover:text-red-600 transition-colors min-w-[64px]"
          >
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs font-bold">S.O.S.</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
