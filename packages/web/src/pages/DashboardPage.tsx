// ══════════════════════════════════════════════
// Dashboard Page
// ══════════════════════════════════════════════

import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, ApiResponse, EventInfo, MessageInfo, HouseholdItemInfo } from "@homeassistan/shared";
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
  Package,
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

  // Próximos eventos
  const { data: upcomingEvents = [] } = useQuery<EventInfo[]>({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data } = await api.get<ApiResponse<EventInfo[]>>(`/calendar?from=${today}&to=${nextWeek}`);
      return (data.data || []).slice(0, 5);
    },
    enabled: canAccessModule("calendar"),
  });

  // Mensajes recientes
  const { data: recentMessages = [] } = useQuery<MessageInfo[]>({
    queryKey: ["recent-messages"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MessageInfo[]>>("/communication/messages?limit=5");
      return (data.data || []).slice(0, 5);
    },
    enabled: canAccessModule("communication"),
  });

  // Items de inventario bajo
  const { data: lowStockItems = [] } = useQuery<HouseholdItemInfo[]>({
    queryKey: ["low-stock-items"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HouseholdItemInfo[]>>("/finance/inventory");
      return (data.data || []).filter((i) => i.isLow).slice(0, 5);
    },
    enabled: canAccessModule("finance"),
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
      <div className="space-y-2">
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
        {lowStockItems.length > 0 && (
          <button
            onClick={() => navigate("/finanzas")}
            className="w-full flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-left hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <Package className="w-5 h-5 text-yellow-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                {lowStockItems.length} artículo{lowStockItems.length > 1 ? "s" : ""} de inventario bajo
              </p>
              <p className="text-xs text-yellow-600/70">{lowStockItems.map(i => i.name).join(", ")}</p>
            </div>
          </button>
        )}
        {stats && stats.unreadNotifications > 0 && (
          <button
            onClick={() => navigate("/comunicacion")}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Bell className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {stats.unreadNotifications} notificación{stats.unreadNotifications > 1 ? "es" : ""} sin leer
              </p>
              <p className="text-xs text-blue-600/70">Toca para ver tus notificaciones</p>
            </div>
          </button>
        )}
      </div>

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

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Próximos eventos */}
        {canAccessModule("calendar") && upcomingEvents.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                Próximos eventos
              </h3>
              <button
                onClick={() => navigate("/calendario")}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Ver todos →
              </button>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(e.startDate).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}
                      {!e.allDay && " · " + new Date(e.startDate).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        {canAccessModule("communication") && recentMessages.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Mensajes recientes
              </h3>
              <button
                onClick={() => navigate("/comunicacion")}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Ver chat →
              </button>
            </div>
            <div className="space-y-2">
              {recentMessages.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {m.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{m.senderName}</p>
                    <p className="text-sm text-slate-900 dark:text-white truncate">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
