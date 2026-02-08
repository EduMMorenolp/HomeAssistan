// ══════════════════════════════════════════════
// Dashboard Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as dashboardService from "../services/dashboard.service";
import type { ApiResponse } from "@homeassistan/shared";

export const dashboardRouter: RouterType = Router();
dashboardRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().max(10).optional(),
  notificationsEnabled: z.boolean().optional(),
  dashboardLayout: z.record(z.unknown()).optional(),
});

// ── Stats ────────────────────────────────────

dashboardRouter.get("/stats", async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardStats(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ── Preferences ──────────────────────────────

dashboardRouter.get("/preferences", async (req, res, next) => {
  try {
    const data = await dashboardService.getPreferences(req.user!.userId, req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

dashboardRouter.put("/preferences", validate(updatePreferencesSchema), async (req, res, next) => {
  try {
    const data = await dashboardService.updatePreferences(
      req.user!.userId,
      req.user!.houseId,
      req.body,
    );
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ── Activity Log ─────────────────────────────

dashboardRouter.get("/activity", async (req, res, next) => {
  try {
    const data = await dashboardService.getActivityLog(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
