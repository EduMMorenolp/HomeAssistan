// ══════════════════════════════════════════════
// Auth Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import * as authService from "./auth.service";
import type { ApiResponse } from "@homeassistan/shared";

export const authRouter: RouterType = Router();

// ── Schemas ──────────────────────────────────

const houseSelectSchema = z.object({
  houseId: z.string().uuid(),
  pin: z.string().min(4).max(8),
});

const userLoginSchema = z.object({
  userId: z.string().uuid(),
  personalPin: z.string().min(4).max(8),
  houseToken: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// ── Endpoints ────────────────────────────────

/** Paso 1: Seleccionar casa con PIN */
authRouter.post("/house/select", validate(houseSelectSchema), async (req, res, next) => {
  try {
    const result = await authService.selectHouse(req.body);
    const response: ApiResponse = { success: true, data: result };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Paso 2: Login de usuario */
authRouter.post("/user/login", validate(userLoginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    const response: ApiResponse = { success: true, data: result };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Refresh token */
authRouter.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    const response: ApiResponse = { success: true, data: result };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Logout */
authRouter.post("/logout", authenticate, async (req, res, next) => {
  try {
    await authService.logout(req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: { message: "Sesión cerrada" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// Onboarding endpoints
// ══════════════════════════════════════════════

const activateSchema = z.object({
  activationToken: z.string(),
  newPin: z.string().min(4).max(8),
});

const selfRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  personalPin: z.string().min(4).max(8),
  houseId: z.string().uuid(),
});

/** Activar cuenta invitada (cambiar temp PIN por personal) */
authRouter.post("/activate", validate(activateSchema), async (req, res, next) => {
  try {
    const result = await authService.activateAccount(req.body);
    const response: ApiResponse = { success: true, data: result };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Auto-registro: solicitar acceso a una casa */
authRouter.post("/register", validate(selfRegisterSchema), async (req, res, next) => {
  try {
    const result = await authService.selfRegister(req.body);
    const response: ApiResponse = { success: true, data: result };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Aprobar solicitud de acceso (admin/responsible) */
authRouter.post(
  "/approve/:userId",
  authenticate,
  async (req, res, next) => {
    try {
      const creatorRole = req.user!.role;
      if (creatorRole !== "admin" && creatorRole !== "responsible") {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Sin permisos" } });
        return;
      }
      const { role } = req.body;
      const result = await authService.approveRequest(
        req.params.userId as string,
        req.user!.houseId,
        role,
      );
      const response: ApiResponse = { success: true, data: result };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Rechazar solicitud de acceso (admin/responsible) */
authRouter.post(
  "/reject/:userId",
  authenticate,
  async (req, res, next) => {
    try {
      const creatorRole = req.user!.role;
      if (creatorRole !== "admin" && creatorRole !== "responsible") {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Sin permisos" } });
        return;
      }
      await authService.rejectRequest(
        req.params.userId as string,
        req.user!.houseId,
      );
      const response: ApiResponse = { success: true, data: { message: "Solicitud rechazada" } };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Obtener solicitudes pendientes de la casa */
authRouter.get(
  "/pending",
  authenticate,
  async (req, res, next) => {
    try {
      const creatorRole = req.user!.role;
      if (creatorRole !== "admin" && creatorRole !== "responsible") {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Sin permisos" } });
        return;
      }
      const pending = await authService.getPendingRequests(req.user!.houseId);
      const response: ApiResponse = { success: true, data: pending };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);
