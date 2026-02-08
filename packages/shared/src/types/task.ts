// ══════════════════════════════════════════════
// Tipos de Tareas
// ══════════════════════════════════════════════

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskRecurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export interface TaskInfo {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string | null;
  dueDate?: string | null;
  recurrence: TaskRecurrence;
  points: number;
  createdBy?: string | null;
  assignees?: TaskAssigneeInfo[];
  createdAt: string;
}

export interface TaskAssigneeInfo {
  id: string;
  userId: string;
  userName?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  recurrence?: TaskRecurrence;
  points?: number;
  assigneeIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
  dueDate?: string;
  recurrence?: TaskRecurrence;
  points?: number;
}

export interface CompleteTaskRequest {
  note?: string;
}

export interface TaskRotationConfig {
  taskId: string;
  memberIds: string[];
  isActive?: boolean;
}

export interface UserRanking {
  userId: string;
  userName: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  tasksCompleted: number;
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const TASK_CATEGORY_DEFAULTS = [
  "Limpieza",
  "Cocina",
  "Jardín",
  "Mantenimiento",
  "Compras",
  "Mascotas",
  "Organización",
  "Otro",
];
