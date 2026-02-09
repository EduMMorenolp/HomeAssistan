// ══════════════════════════════════════════════
// Sidebar Navigation - Responsive + RBAC
// ══════════════════════════════════════════════

import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionModule } from "@homeassistan/shared";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Calendar,
  Wallet,
  Heart,
  Shield,
  Settings,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  /** Módulo de permisos requerido (null = siempre visible) */
  module: PermissionModule | null;
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: Home, label: "Inicio", module: "dashboard" },
  { to: "/comunicacion", icon: MessageSquare, label: "Comunicación", module: "communication" },
  { to: "/tareas", icon: CheckSquare, label: "Tareas", module: "tasks" },
  { to: "/calendario", icon: Calendar, label: "Calendario", module: "calendar" },
  { to: "/finanzas", icon: Wallet, label: "Finanzas", module: "finance" },
  { to: "/salud", icon: Heart, label: "Salud", module: "health" },
  { to: "/seguridad", icon: Shield, label: "Seguridad", module: "security" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { house, logout } = useAuthStore();
  const { canAccessModule, isAdmin } = usePermissions();

  // Filtrar items de navegación según el rol del usuario
  const visibleItems = navItems.filter(
    (item) => item.module === null || canAccessModule(item.module),
  );

  const sidebarContent = (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* House name */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
            {house?.name?.charAt(0) || "H"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {house?.name || "Mi Casa"}
            </h2>
            <p className="text-xs text-slate-500">HomeAsisstan</p>
          </div>
          {/* Botón cerrar en mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50",
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}

        {/* Admin link — solo para admin */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 border-t border-slate-200 dark:border-slate-700 pt-3",
                isActive
                  ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
              )
            }
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="truncate">Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
        >
          <Settings className="w-5 h-5 shrink-0" />
          Configuración
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: sidebar estático ── */}
      <div className="hidden lg:flex lg:shrink-0">{sidebarContent}</div>

      {/* ── Mobile: overlay + sidebar deslizable ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 sidebar-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sidebar panel */}
          <div className="relative h-full w-64 max-w-[80vw] sidebar-slide">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
