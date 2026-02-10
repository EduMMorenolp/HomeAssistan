// ══════════════════════════════════════════════
// Dashboard Page
// ══════════════════════════════════════════════

import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, ApiResponse } from "@homeassistan/shared";
import type { PermissionModule } from "@homeassistan/shared";
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  Wallet,
  Heart,
  Shield,
  Bell,
  Users,
  AlertTriangle,
  TrendingUp,
  PawPrint,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const moduleCards = [
  {
    to: "/comunicacion",
    icon: MessageSquare,
    label: "Comunicación",
    description: "Muro, chat y avisos",
    color: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-900/20",
    module: "communication" as PermissionModule,
  },
  {
    to: "/tareas",
    icon: CheckSquare,
    label: "Tareas",
    description: "Gestión y asignación",
    color: "bg-green-500",
    lightBg: "bg-green-50 dark:bg-green-900/20",
    module: "tasks" as PermissionModule,
  },
  {
    to: "/calendario",
    icon: Calendar,
    label: "Calendario",
    description: "Eventos y recordatorios",
    color: "bg-yellow-500",
    lightBg: "bg-yellow-50 dark:bg-yellow-900/20",
    module: "calendar" as PermissionModule,
  },
  {
    to: "/finanzas",
    icon: Wallet,
    label: "Finanzas",
    description: "Gastos y compras",
    color: "bg-orange-500",
    lightBg: "bg-orange-50 dark:bg-orange-900/20",
    module: "finance" as PermissionModule,
  },
  {
    to: "/salud",
    icon: Heart,
    label: "Salud",
    description: "Medicamentos y rutinas",
    color: "bg-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-900/20",
    module: "health" as PermissionModule,
  },
  {
    to: "/seguridad",
    icon: Shield,
    label: "Seguridad",
    description: "Emergencias y accesos",
    color: "bg-red-500",
    lightBg: "bg-red-50 dark:bg-red-900/20",
    module: "security" as PermissionModule,
  },
];

export function DashboardPage() {
  const { user, house } = useAuthStore();
  const { canAccessModule } = usePermissions();
  const navigate = useNavigate();

  // Filtrar cards de módulos según permisos del rol
  const visibleCards = moduleCards.filter((card) => canAccessModule(card.module));

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
      return data.data!;
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Hola, {user?.name} 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Bienvenido a {house?.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Miembros", value: stats?.houseMembersCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
          { label: "Tareas pendientes", value: stats?.pendingTasks, icon: CheckSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/30" },
          { label: "Notificaciones", value: stats?.unreadNotifications, icon: Bell, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30" },
          { label: "Eventos hoy", value: stats?.todayEvents, icon: Calendar, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
          { label: "Gastos del mes", value: stats ? `$${stats.monthExpenses.toLocaleString("es")}` : undefined, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
          { label: "Meds bajo stock", value: stats?.lowStockMeds, icon: AlertTriangle, color: stats?.lowStockMeds ? "text-red-500" : "text-slate-400", bg: stats?.lowStockMeds ? "bg-red-50 dark:bg-red-900/30" : "bg-slate-50 dark:bg-slate-800" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {s.value ?? "—"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {stats && stats.lowStockMeds > 0 && (
        <button
          onClick={() => navigate("/salud")}
          className="w-full flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {stats.lowStockMeds} medicamento{stats.lowStockMeds > 1 ? "s" : ""} con stock bajo
            </p>
            <p className="text-xs text-red-500/70">Toca para revisar en el módulo de Salud</p>
          </div>
        </button>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Nueva tarea", to: "/tareas", icon: Plus, color: "bg-green-500" },
            { label: "Nuevo gasto", to: "/finanzas", icon: TrendingUp, color: "bg-orange-500" },
            { label: "Nuevo evento", to: "/calendario", icon: Calendar, color: "bg-yellow-500" },
            { label: "Anuncio", to: "/comunicacion", icon: MessageSquare, color: "bg-blue-500" },
          ]
            .filter((a) => {
              const modMap: Record<string, PermissionModule> = {
                "/tareas": "tasks",
                "/finanzas": "finance",
                "/calendario": "calendar",
                "/comunicacion": "communication",
              };
              return canAccessModule(modMap[a.to]!);
            })
            .map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:shadow-sm transition-all"
              >
                <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white", a.color)}>
                  <a.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">{a.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Módulos
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {visibleCards.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={cn(
                "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all text-left group",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0",
                  card.color,
                )}
              >
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                  {card.label}
                </p>
                <p className="text-xs text-slate-500">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
