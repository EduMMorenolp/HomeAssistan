// ══════════════════════════════════════════════
// Users Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import {
  authenticate,
  authorize,
  ownerOrRole,
  requirePermission,
  belongsToHouse,
} from "../../middleware/auth";
import * as usersService from "./users.service";
import * as authService from "../auth/auth.service";
import type { ApiResponse } from "@homeassistan/shared";
import { ROLE_HIERARCHY, type Role } from "@homeassistan/shared";
import { AppError } from "../../middleware/error-handler";

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
  // External access config (only used when role = 'external')
  accessSchedule: z
    .object({
      days: z.array(z.string()).optional(),
      timeStart: z.string().optional(),
      timeEnd: z.string().optional(),
    })
    .optional(),
  allowedModules: z.array(z.string()).optional(),
  accessExpiry: z.string().optional(),
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
            new AppError(
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
            new AppError(
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

// ══════════════════════════════════════════════
// House-level Member Management
// ══════════════════════════════════════════════

/** Obtener miembros de una casa */
usersRouter.get(
  "/house/:houseId/members",
  authenticate,
  belongsToHouse("houseId"),
  async (req, res, next) => {
    try {
      const members = await usersService.getHouseMembers(req.params.houseId as string);
      const response: ApiResponse = { success: true, data: members };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Cambiar rol de un miembro (admin o responsible) */
usersRouter.patch(
  "/house/:houseId/members/:userId/role",
  authenticate,
  belongsToHouse("houseId"),
  requirePermission("system", "createUserOther"),
  async (req, res, next) => {
    try {
      const { role } = req.body;
      const { userId, houseId } = req.params;
      const creatorRole = req.user!.role;

      if (!role) {
        res.status(400).json({ error: "role is required" });
        return;
      }

      // Un responsible NO puede crear/promover a responsible o admin
      if (
        (role === "responsible" || role === "admin") &&
        creatorRole !== "admin"
      ) {
        res.status(403).json({
          error: "Solo un administrador puede asignar rol responsible o admin",
        });
        return;
      }

      // No se puede cambiar el rol de alguien con mayor jerarquía
      const members = await usersService.getHouseMembers(houseId as string);
      const targetMember = members.find((m) => m.userId === userId);
      if (
        targetMember &&
        ROLE_HIERARCHY[targetMember.role as Role] >= ROLE_HIERARCHY[creatorRole as Role]
      ) {
        res.status(403).json({
          error: "No puedes cambiar el rol de un usuario con igual o mayor jerarquía",
        });
        return;
      }

      const updated = await usersService.updateMemberRole(
        userId as string,
        houseId as string,
        role as Role,
      );
      const response: ApiResponse = { success: true, data: updated };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Remover miembro de la casa (no elimina la cuenta) */
usersRouter.delete(
  "/house/:houseId/members/:userId",
  authenticate,
  belongsToHouse("houseId"),
  requirePermission("system", "deleteUsers"),
  async (req, res, next) => {
    try {
      const { userId, houseId } = req.params;

      // No se puede eliminar a uno mismo
      if (userId === req.user!.userId) {
        res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
        return;
      }

      await usersService.removeMember(userId as string, houseId as string);
      const response: ApiResponse = {
        success: true,
        data: { message: "Miembro eliminado de la casa" },
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════
// Invitation Management
// ══════════════════════════════════════════════

const inviteSchema = z.object({
  name: z.string().min(2).max(100),
  role: z
    .enum(["member", "simplified", "external"])
    .optional()
    .default("member"),
  tempPin: z.string().min(4).max(8),
});

/** Invitar nuevo miembro a la casa */
usersRouter.post(
  "/house/:houseId/invite",
  authenticate,
  belongsToHouse("houseId"),
  requirePermission("system", "createUserOther"),
  validate(inviteSchema),
  async (req, res, next) => {
    try {
      const { houseId } = req.params;
      const { name, role, tempPin } = req.body;

      const result = await authService.inviteMember({
        name,
        houseId: houseId as string,
        role: role as Role,
        tempPin,
        invitedBy: req.user!.userId,
      });
      const response: ApiResponse = { success: true, data: result };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
);
