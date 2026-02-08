// ══════════════════════════════════════════════
// Dashboard Page
// ══════════════════════════════════════════════

import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { DashboardStats, ApiResponse } from "@homeassistan/shared";
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  Wallet,
  Heart,
  Shield,
  Bell,
  Users,
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
  },
  {
    to: "/tareas",
    icon: CheckSquare,
    label: "Tareas",
    description: "Gestión y asignación",
    color: "bg-green-500",
    lightBg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    to: "/calendario",
    icon: Calendar,
    label: "Calendario",
    description: "Eventos y recordatorios",
    color: "bg-yellow-500",
    lightBg: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    to: "/finanzas",
    icon: Wallet,
    label: "Finanzas",
    description: "Gastos y compras",
    color: "bg-orange-500",
    lightBg: "bg-orange-50 dark:bg-orange-900/20",
  },
  {
    to: "/salud",
    icon: Heart,
    label: "Salud",
    description: "Medicamentos y rutinas",
    color: "bg-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    to: "/seguridad",
    icon: Shield,
    label: "Seguridad",
    description: "Emergencias y accesos",
    color: "bg-red-500",
    lightBg: "bg-red-50 dark:bg-red-900/20",
  },
];

export function DashboardPage() {
  const { user, house } = useAuthStore();
  const navigate = useNavigate();

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
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.houseMembersCount ?? "—"}
              </p>
              <p className="text-xs text-slate-500">Miembros</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.pendingTasks ?? "—"}
              </p>
              <p className="text-xs text-slate-500">Tareas pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.unreadNotifications ?? "—"}
              </p>
              <p className="text-xs text-slate-500">Notificaciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Módulos
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {moduleCards.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={cn(
                "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all text-left group"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0",
                  card.color
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
