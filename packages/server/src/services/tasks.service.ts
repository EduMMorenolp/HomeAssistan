// ══════════════════════════════════════════════
// Tasks Service
// ══════════════════════════════════════════════

import { eq, and, desc, sql } from "drizzle-orm";
import {
  db,
  tasks,
  taskAssignments,
  taskCompletions,
  taskRotations,
  userPoints,
  users,
} from "@homeassistan/database";
import type { CreateTaskRequest, UpdateTaskRequest } from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

// ── CRUD Tareas ──────────────────────────────

export async function getTasksByHouse(houseId: string) {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      status: tasks.status,
      category: tasks.category,
      dueDate: tasks.dueDate,
      recurrence: tasks.recurrence,
      points: tasks.points,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(eq(tasks.houseId, houseId))
    .orderBy(desc(tasks.createdAt));

  // Cargar asignaciones para cada tarea
  const taskIds = rows.map((t) => t.id);
  if (taskIds.length === 0) return [];

  const allAssignments = await db
    .select({
      id: taskAssignments.id,
      taskId: taskAssignments.taskId,
      userId: taskAssignments.userId,
      userName: users.name,
    })
    .from(taskAssignments)
    .innerJoin(users, eq(taskAssignments.userId, users.id));

  return rows.map((task) => ({
    ...task,
    assignees: allAssignments
      .filter((a) => a.taskId === task.id)
      .map((a) => ({ id: a.id, userId: a.userId, userName: a.userName })),
  }));
}

export async function getTaskById(taskId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Tarea no encontrada");
  }

  const assignees = await db
    .select({
      id: taskAssignments.id,
      userId: taskAssignments.userId,
      userName: users.name,
    })
    .from(taskAssignments)
    .innerJoin(users, eq(taskAssignments.userId, users.id))
    .where(eq(taskAssignments.taskId, taskId));

  return { ...task, assignees };
}

export async function createTask(houseId: string, userId: string, data: CreateTaskRequest) {
  const [task] = await db
    .insert(tasks)
    .values({
      houseId,
      title: data.title,
      description: data.description,
      priority: data.priority || "medium",
      category: data.category,
      dueDate: data.dueDate,
      recurrence: data.recurrence || "none",
      points: data.points ?? 10,
      createdBy: userId,
    })
    .returning();

  // Asignar miembros si se proporcionan
  if (data.assigneeIds?.length) {
    await db.insert(taskAssignments).values(
      data.assigneeIds.map((uid) => ({
        taskId: task.id,
        userId: uid,
      })),
    );
  }

  return task;
}

export async function updateTask(taskId: string, data: UpdateTaskRequest) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.points !== undefined) updateData.points = data.points;

  const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, taskId)).returning();

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Tarea no encontrada");
  }

  return task;
}

export async function deleteTask(taskId: string) {
  const [task] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning({ id: tasks.id });

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Tarea no encontrada");
  }
}

// ── Asignaciones ─────────────────────────────

export async function assignTask(taskId: string, userIds: string[]) {
  // Eliminar asignaciones anteriores
  await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));

  if (userIds.length === 0) return [];

  return db
    .insert(taskAssignments)
    .values(userIds.map((userId) => ({ taskId, userId })))
    .returning();
}

// ── Completar tarea ──────────────────────────

export async function completeTask(taskId: string, userId: string, note?: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Tarea no encontrada");
  }

  // Marcar como completada
  await db
    .update(tasks)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  // Registrar completado
  const [completion] = await db
    .insert(taskCompletions)
    .values({
      taskId,
      completedBy: userId,
      pointsEarned: task.points,
      note,
    })
    .returning();

  // Actualizar puntos del usuario
  await updateUserPoints(userId, task.houseId, task.points);

  // Si tiene rotación activa, avanzar al siguiente
  await advanceRotation(taskId);

  return completion;
}

// ── Rotaciones ───────────────────────────────

export async function setRotation(config: {
  taskId: string;
  memberIds: string[];
  isActive?: boolean;
}) {
  // Upsert: eliminar rotación existente y crear nueva
  await db.delete(taskRotations).where(eq(taskRotations.taskId, config.taskId));

  const [rotation] = await db
    .insert(taskRotations)
    .values({
      taskId: config.taskId,
      memberIds: JSON.stringify(config.memberIds),
      isActive: config.isActive ?? true,
      currentIndex: 0,
    })
    .returning();

  // Asignar tarea al primer miembro
  if (config.memberIds.length > 0) {
    await assignTask(config.taskId, [config.memberIds[0]]);
  }

  return rotation;
}

async function advanceRotation(taskId: string) {
  const [rotation] = await db
    .select()
    .from(taskRotations)
    .where(and(eq(taskRotations.taskId, taskId), eq(taskRotations.isActive, true)))
    .limit(1);

  if (!rotation) return;

  const memberIds: string[] = JSON.parse(rotation.memberIds);
  if (memberIds.length === 0) return;

  const nextIndex = (rotation.currentIndex + 1) % memberIds.length;

  await db
    .update(taskRotations)
    .set({ currentIndex: nextIndex })
    .where(eq(taskRotations.id, rotation.id));

  // Re-asignar tarea al siguiente miembro y resetear estado
  await assignTask(taskId, [memberIds[nextIndex]]);
  await db
    .update(tasks)
    .set({ status: "pending", updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
}

// ── Gamificación ─────────────────────────────

async function updateUserPoints(userId: string, houseId: string, points: number) {
  const [existing] = await db
    .select()
    .from(userPoints)
    .where(and(eq(userPoints.userId, userId), eq(userPoints.houseId, houseId)))
    .limit(1);

  if (existing) {
    await db
      .update(userPoints)
      .set({
        totalPoints: existing.totalPoints + points,
        weeklyPoints: existing.weeklyPoints + points,
        monthlyPoints: existing.monthlyPoints + points,
        tasksCompleted: existing.tasksCompleted + 1,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.id, existing.id));
  } else {
    await db.insert(userPoints).values({
      userId,
      houseId,
      totalPoints: points,
      weeklyPoints: points,
      monthlyPoints: points,
      tasksCompleted: 1,
    });
  }
}

export async function getRankings(houseId: string) {
  return db
    .select({
      userId: userPoints.userId,
      userName: users.name,
      totalPoints: userPoints.totalPoints,
      weeklyPoints: userPoints.weeklyPoints,
      monthlyPoints: userPoints.monthlyPoints,
      tasksCompleted: userPoints.tasksCompleted,
    })
    .from(userPoints)
    .innerJoin(users, eq(userPoints.userId, users.id))
    .where(eq(userPoints.houseId, houseId))
    .orderBy(desc(userPoints.totalPoints));
}

export async function getTaskHistory(houseId: string, limit = 20) {
  return db
    .select({
      id: taskCompletions.id,
      taskId: taskCompletions.taskId,
      taskTitle: tasks.title,
      completedBy: taskCompletions.completedBy,
      completedByName: users.name,
      pointsEarned: taskCompletions.pointsEarned,
      note: taskCompletions.note,
      completedAt: taskCompletions.completedAt,
    })
    .from(taskCompletions)
    .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
    .leftJoin(users, eq(taskCompletions.completedBy, users.id))
    .where(eq(tasks.houseId, houseId))
    .orderBy(desc(taskCompletions.completedAt))
    .limit(limit);
}
