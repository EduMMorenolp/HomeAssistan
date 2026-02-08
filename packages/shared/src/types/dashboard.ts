// ══════════════════════════════════════════════
// Tipos de Dashboard / Preferencias
// ══════════════════════════════════════════════

export type ThemeMode = "light" | "dark" | "system";

export interface UserPreferencesInfo {
  id: string;
  userId: string;
  theme: ThemeMode;
  language: string;
  notificationsEnabled: boolean;
  dashboardLayout?: Record<string, unknown> | null;
}

export interface UpdatePreferencesRequest {
  theme?: ThemeMode;
  language?: string;
  notificationsEnabled?: boolean;
  dashboardLayout?: Record<string, unknown>;
}

export interface ActivityLogInfo {
  id: string;
  userId?: string | null;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardStats {
  pendingTasks: number;
  todayEvents: number;
  unreadNotifications: number;
  lowStockMeds: number;
  monthExpenses: number;
  houseMembersCount: number;
}
