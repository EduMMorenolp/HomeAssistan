// ══════════════════════════════════════════════
// Auth Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as authService from "../services/auth.service";
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
