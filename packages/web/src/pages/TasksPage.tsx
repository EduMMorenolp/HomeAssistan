// ══════════════════════════════════════════════
// Tasks Page — Gestión de tareas del hogar
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trophy,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Filter,
  Users,
  RotateCcw,
  Pencil,
} from "lucide-react";
import type {
  TaskInfo,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
  CreateTaskRequest,
  UpdateTaskRequest,
  UserRanking,
} from "@homeassistan/shared";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_CATEGORY_DEFAULTS,
} from "@homeassistan/shared";

// ── Constantes de UI ─────────────────────────

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_ICONS: Record<TaskStatus, typeof Circle> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: X,
};

type TabKey = "tasks" | "rankings";

// ══════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════

export function TasksPage() {
  const [tab, setTab] = useState<TabKey>("tasks");
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Tareas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona las tareas del hogar
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nueva tarea
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {(
          [
            { key: "tasks", label: "Tareas", icon: CheckCircle2 },
            { key: "rankings", label: "Ranking", icon: Trophy },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "tasks" && (
        <TaskList
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
        />
      )}
      {tab === "rankings" && <Rankings />}

      {/* Modal para crear tarea */}
      {showForm && <CreateTaskModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════
// Lista de Tareas
// ══════════════════════════════════════════════

function TaskList({
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
}: {
  filterStatus: TaskStatus | "all";
  setFilterStatus: (v: TaskStatus | "all") => void;
  filterPriority: TaskPriority | "all";
  setFilterPriority: (v: TaskPriority | "all") => void;
}) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await api.get("/tasks");
      return data.data as TaskInfo[];
    },
  });

  const filtered = (tasks ?? []).filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const pending = filtered.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completed = filtered.filter((t) => t.status === "completed");

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="all">Todos los estados</option>
          {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <option value="all">Todas las prioridades</option>
          {(Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay tareas</p>
        </div>
      ) : (
        <>
          {/* Pendientes */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pendientes ({pending.length})
              </h3>
              <div className="space-y-2">
                {pending.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Completadas */}
          {completed.length > 0 && <CompletedSection tasks={completed} />}
        </>
      )}
    </div>
  );
}

// ── Sección completadas (colapsable) ─────────

function CompletedSection({ tasks }: { tasks: TaskInfo[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        Completadas ({tasks.length})
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// Task Card
// ══════════════════════════════════════════════

function TaskCard({ task }: { task: TaskInfo }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/tasks/${task.id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["rankings"] });
      toast.success("¡Tarea completada! 🎉");
    },
    onError: () => toast.error("Error al completar tarea"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea eliminada");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const isCompleted = task.status === "completed";
  const StatusIcon = STATUS_ICONS[task.status];
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && !isCompleted && dueDate < new Date();

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 transition-all",
        isCompleted && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Botón completar */}
        <button
          onClick={() => !isCompleted && completeMutation.mutate()}
          disabled={isCompleted || completeMutation.isPending}
          className={cn(
            "mt-0.5 shrink-0 transition-colors",
            isCompleted
              ? "text-green-500"
              : "text-slate-300 hover:text-green-400 dark:text-slate-600 dark:hover:text-green-400",
          )}
        >
          {completeMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <StatusIcon className="w-5 h-5" />
          )}
        </button>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4
              className={cn(
                "font-medium text-slate-900 dark:text-white text-sm sm:text-base",
                isCompleted && "line-through",
              )}
            >
              {task.title}
            </h4>
            <span
              className={cn(
                "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium",
                PRIORITY_STYLES[task.priority],
              )}
            >
              {TASK_PRIORITY_LABELS[task.priority]}
            </span>
            {task.points > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                <Star className="w-3 h-3" />
                {task.points}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1.5 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
            {task.category && (
              <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                {task.category}
              </span>
            )}
            {task.recurrence !== "none" && (
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                {task.recurrence}
              </span>
            )}
            {dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-500 dark:text-red-400 font-medium",
                )}
              >
                <Clock className="w-3 h-3" />
                {dueDate.toLocaleDateString("es")}
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
              </span>
            )}
            {task.assignees && task.assignees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {task.assignees.map((a) => a.userName || "?").join(", ")}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          {!isCompleted && (
            <button
              onClick={() => setEditing(true)}
              className="text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 transition-colors p-0.5"
              title="Editar tarea"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {(user?.role === "admin" || user?.role === "responsible") && (
            <button
              onClick={() => {
                if (confirm("¿Eliminar esta tarea?")) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {editing && <EditTaskModal task={task} onClose={() => setEditing(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════
// Rankings / Gamificación
// ══════════════════════════════════════════════

function Rankings() {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: async () => {
      const { data } = await api.get("/tasks/gamification/rankings");
      return data.data as UserRanking[];
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );

  if (!rankings || rankings.length === 0)
    return (
      <div className="text-center py-12 text-slate-400">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Aún no hay puntuaciones</p>
      </div>
    );

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      {rankings.map((r, i) => (
        <div
          key={r.userId}
          className={cn(
            "flex items-center gap-3 sm:gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4",
            i === 0 && "ring-2 ring-yellow-400/30",
          )}
        >
          <span className="text-xl sm:text-2xl font-bold w-8 text-center shrink-0">
            {medals[i] || `#${i + 1}`}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{r.userName}</p>
            <p className="text-xs text-slate-400">
              {r.tasksCompleted} tareas · Semanal: {r.weeklyPoints} · Mensual: {r.monthlyPoints}
            </p>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
            <Star className="w-5 h-5" />
            {r.totalPoints}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════
// Modal: Editar Tarea
// ══════════════════════════════════════════════

function EditTaskModal({ task, onClose }: { task: TaskInfo; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateTaskRequest>({
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    category: task.category ?? "",
    recurrence: task.recurrence ?? "none",
    points: task.points ?? 10,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (body: UpdateTaskRequest) => {
      const { data } = await api.put(`/tasks/${task.id}`, body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea actualizada");
      onClose();
    },
    onError: () => toast.error("Error al actualizar tarea"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Editar tarea</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={form.title ?? ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={form.priority ?? "medium"}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                {(Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sin categoría</option>
                {TASK_CATEGORY_DEFAULTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Recurrencia
              </label>
              <select
                value={form.recurrence ?? "none"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence: e.target.value as TaskRecurrence,
                  })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="none">Sin repetir</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Puntos
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={form.points ?? 10}
                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha límite
            </label>
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value || undefined })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending || !form.title?.trim()}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pencil className="w-4 h-4" />
            )}
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// Modal: Crear Tarea
// ══════════════════════════════════════════════

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateTaskRequest>({
    title: "",
    priority: "medium",
    recurrence: "none",
    points: 10,
    category: "",
  });

  const mutation = useMutation({
    mutationFn: async (body: CreateTaskRequest) => {
      const { data } = await api.post("/tasks", body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea creada");
      onClose();
    },
    onError: () => toast.error("Error al crear tarea"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    mutation.mutate({ ...form, title: form.title.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nueva tarea</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: Lavar los platos"
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Opcional"
              rows={2}
            />
          </div>

          {/* Grid 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                {(Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sin categoría</option>
                {TASK_CATEGORY_DEFAULTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Recurrencia */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Recurrencia
              </label>
              <select
                value={form.recurrence}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence: e.target.value as TaskRecurrence,
                  })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="none">Sin repetir</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            {/* Puntos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Puntos
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={form.points ?? 10}
                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha límite
            </label>
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value || undefined })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending || !form.title.trim()}
            className="w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Crear tarea
          </button>
        </form>
      </div>
    </div>
  );
}
