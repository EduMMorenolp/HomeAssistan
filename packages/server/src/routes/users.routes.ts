// ══════════════════════════════════════════════
// Users Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize, ownerOrRole, requirePermission } from "../middleware/auth";
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

const changePinSchema = z.object({
  currentPin: z.string().min(4).max(8),
  newPin: z.string().min(4).max(8),
});

// ── Endpoints ────────────────────────────────

/** Crear usuario y asignarlo a una casa (admin o responsible) */
usersRouter.post(
  "/",
  authenticate,
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      // Verificar permisos según el rol del nuevo usuario
      const targetRole = req.body.role || "member";
      const creatorRole = req.user!.role;

      // Solo admin puede crear responsables
      if (targetRole === "responsible" || targetRole === "admin") {
        if (creatorRole !== "admin") {
          return next(
            new (await import("../middleware/error-handler")).AppError(
              403,
              "FORBIDDEN",
              "Solo un administrador puede crear usuarios con rol responsable o admin",
            ),
          );
        }
      } else {
        // Para member/simplified/external: admin o responsible
        if (creatorRole !== "admin" && creatorRole !== "responsible") {
          return next(
            new (await import("../middleware/error-handler")).AppError(
              403,
              "FORBIDDEN",
              "No tienes permisos para crear usuarios",
            ),
          );
        }
      }

      const user = await usersService.createUser(req.body);
      const response: ApiResponse = { success: true, data: user };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
);

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

/** Actualizar perfil (propio o admin/responsible puede editar otros) */
usersRouter.patch(
  "/:id",
  authenticate,
  ownerOrRole("responsible"),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await usersService.updateUser(req.params.id as string, req.body);
      const response: ApiResponse = { success: true, data: user };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Cambiar PIN propio */
usersRouter.patch(
  "/:id/pin",
  authenticate,
  ownerOrRole("admin"),
  validate(changePinSchema),
  async (req, res, next) => {
    try {
      await usersService.changePin(req.params.id as string, req.body.currentPin, req.body.newPin);
      const response: ApiResponse = {
        success: true,
        data: { message: "PIN actualizado correctamente" },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

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
