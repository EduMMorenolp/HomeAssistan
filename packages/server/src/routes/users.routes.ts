// ══════════════════════════════════════════════
// Users Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import * as usersService from "../services/users.service";
import type { ApiResponse } from "@homeassistan/shared";

export const usersRouter: RouterType = Router();

// ── Schemas ──────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  personalPin: z.string().min(4).max(8),
  profileType: z.enum(["power", "focus"]).optional().default("power"),
  houseId: z.string().uuid(),
  role: z
    .enum(["admin", "responsible", "member", "simplified", "external", "pet"])
    .optional()
    .default("member"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatar: z.string().optional(),
  profileType: z.enum(["power", "focus"]).optional(),
});

// ── Endpoints ────────────────────────────────

/** Crear usuario y asignarlo a una casa */
usersRouter.post("/", validate(createUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);
    const response: ApiResponse = { success: true, data: user };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Obtener perfil propio */
usersRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.user!.userId);
    const response: ApiResponse = { success: true, data: user };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Obtener usuario por ID */
usersRouter.get("/:id", authenticate, async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id as string);
    const response: ApiResponse = { success: true, data: user };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Actualizar perfil */
usersRouter.patch("/:id", authenticate, validate(updateUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id as string, req.body);
    const response: ApiResponse = { success: true, data: user };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Eliminar usuario (solo admin) */
usersRouter.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.id as string);
    const response: ApiResponse = {
      success: true,
      data: { message: "Usuario eliminado" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
