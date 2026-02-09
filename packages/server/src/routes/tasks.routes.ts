// ══════════════════════════════════════════════
// Tasks Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize, requirePermission } from "../middleware/auth";
import * as tasksService from "../services/tasks.service";
import type { ApiResponse } from "@homeassistan/shared";

export const tasksRouter: RouterType = Router();

// Todas las rutas requieren autenticación
tasksRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category: z.string().max(50).optional(),
  dueDate: z.string().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "biweekly", "monthly"]).optional(),
  points: z.number().int().min(0).max(1000).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  category: z.string().max(50).optional(),
  dueDate: z.string().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "biweekly", "monthly"]).optional(),
  points: z.number().int().min(0).max(1000).optional(),
});

const assignSchema = z.object({
  userIds: z.array(z.string().uuid()),
});

const completeSchema = z.object({
  note: z.string().max(500).optional(),
});

const rotationSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(2),
  isActive: z.boolean().optional(),
});

// ── Endpoints ────────────────────────────────

/** Listar tareas de la casa */
tasksRouter.get("/", requirePermission("tasks", "viewTasks"), async (req, res, next) => {
  try {
    const houseId = req.user!.houseId;
    const data = await tasksService.getTasksByHouse(houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Obtener tarea por ID */
tasksRouter.get("/:id", requirePermission("tasks", "viewTasks"), async (req, res, next) => {
  try {
    const data = await tasksService.getTaskById(req.params.id as string);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Crear tarea (admin/resp: asignar a cualquiera, member/simplified: solo propias) */
tasksRouter.post("/", requirePermission("tasks", "createOwn"), validate(createTaskSchema), async (req, res, next) => {
  try {
    const data = await tasksService.createTask(req.user!.houseId, req.user!.userId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Actualizar tarea (admin/resp o creador) */
tasksRouter.patch("/:id", requirePermission("tasks", "createOwn"), validate(updateTaskSchema), async (req, res, next) => {
  try {
    const data = await tasksService.updateTask(req.params.id as string, req.body);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Eliminar tarea (admin/resp) */
tasksRouter.delete("/:id", requirePermission("tasks", "deleteTasks"), async (req, res, next) => {
  try {
    await tasksService.deleteTask(req.params.id as string);
    const response: ApiResponse = {
      success: true,
      data: { message: "Tarea eliminada" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Asignar usuarios a tarea (admin/resp) */
tasksRouter.post("/:id/assign", requirePermission("tasks", "createAndAssign"), validate(assignSchema), async (req, res, next) => {
  try {
    const data = await tasksService.assignTask(req.params.id as string, req.body.userIds);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Completar tarea (todos los roles activos) */
tasksRouter.post("/:id/complete", requirePermission("tasks", "markComplete"), validate(completeSchema), async (req, res, next) => {
  try {
    const data = await tasksService.completeTask(
      req.params.id as string,
      req.user!.userId,
      req.body.note,
    );
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Configurar rotación (admin/resp) */
tasksRouter.post(
  "/:id/rotation",
  requirePermission("tasks", "configureRotation"),
  validate(rotationSchema),
  async (req, res, next) => {
    try {
      const data = await tasksService.setRotation({
        taskId: req.params.id as string,
        memberIds: req.body.memberIds,
        isActive: req.body.isActive,
      });
      const response: ApiResponse = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Rankings de gamificación */
tasksRouter.get("/gamification/rankings", requirePermission("tasks", "viewTasks"), async (req, res, next) => {
  try {
    const data = await tasksService.getRankings(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Historial de completados */
tasksRouter.get("/gamification/history", requirePermission("tasks", "viewTasks"), async (req, res, next) => {
  try {
    const data = await tasksService.getTaskHistory(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
