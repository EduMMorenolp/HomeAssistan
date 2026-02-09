// ══════════════════════════════════════════════
// Routes: Admin Panel
// ══════════════════════════════════════════════

import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import * as adminService from "../services/admin.service.js";

export const adminRouter = Router();

// All admin routes require authentication + admin panel access
adminRouter.use(authenticate, requirePermission("system", "accessAdminPanel"));

// ── GET /api/admin/stats ──────────────────────
// System-wide statistics
adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/users ──────────────────────
// All users across all houses
adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/admin/users/:userId/role ───────
// Change a user's role (admin-level)
adminRouter.patch("/users/:userId/role", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { houseId, role } = req.body;

    if (!houseId || !role) {
      res.status(400).json({ error: "houseId and role are required" });
      return;
    }

    const validRoles = [
      "admin",
      "responsible",
      "member",
      "simplified",
      "external",
      "pet",
    ];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
      return;
    }

    const updated = await adminService.changeUserRole(userId, houseId, role);
    if (!updated) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    // Log the action
    await adminService.logActivity(
      "role_change",
      req.user!.userId,
      houseId,
      "user",
      userId,
      JSON.stringify({ newRole: role }),
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── POST /api/admin/users/:userId/revoke ──────
// Force logout a user
adminRouter.post("/users/:userId/revoke", async (req, res, next) => {
  try {
    const { userId } = req.params;
    await adminService.revokeUserSessions(userId);

    await adminService.logActivity(
      "force_logout",
      req.user!.userId,
      req.user!.houseId,
      "session",
      userId,
    );

    res.json({ message: "Sessions revoked" });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/logs ───────────────────────
// Activity logs with pagination
adminRouter.get("/logs", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const houseId = req.query.houseId as string | undefined;

    const result = await adminService.getActivityLogs(limit, offset, houseId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ── GET /api/admin/config ─────────────────────
// System configuration
adminRouter.get("/config", async (_req, res, next) => {
  try {
    const config = await adminService.getSystemConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/admin/config/:key ────────────────
// Update a config value
adminRouter.put("/config/:key", async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      res.status(400).json({ error: "value is required" });
      return;
    }

    const updated = await adminService.updateSystemConfig(key, String(value));
    if (!updated) {
      res.status(404).json({ error: `Config key "${key}" not found` });
      return;
    }

    await adminService.logActivity(
      "config_update",
      req.user!.userId,
      req.user!.houseId,
      "system_config",
      key,
      JSON.stringify({ value }),
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
});
