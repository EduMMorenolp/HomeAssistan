// ══════════════════════════════════════════════
// Communication Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize, requirePermission } from "../middleware/auth";
import * as commService from "../services/communication.service";
import type { ApiResponse } from "@homeassistan/shared";

export const communicationRouter: RouterType = Router();
communicationRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  priority: z.enum(["normal", "important", "urgent"]).optional(),
  isPinned: z.boolean().optional(),
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(2000).optional(),
  priority: z.enum(["normal", "important", "urgent"]).optional(),
  isPinned: z.boolean().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

// ══════════════════════════════════════════════
// ANUNCIOS
// ══════════════════════════════════════════════

communicationRouter.get("/announcements", requirePermission("communication", "viewAnnouncements"), async (req, res, next) => {
  try {
    const data = await commService.getAnnouncements(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.post(
  "/announcements",
  requirePermission("communication", "manageAnnouncements"),
  validate(createAnnouncementSchema),
  async (req, res, next) => {
    try {
      const data = await commService.createAnnouncement(
        req.user!.houseId,
        req.user!.userId,
        req.body,
      );
      const response: ApiResponse = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
);

communicationRouter.put(
  "/announcements/:id",
  requirePermission("communication", "manageAnnouncements"),
  validate(updateAnnouncementSchema),
  async (req, res, next) => {
    try {
      const data = await commService.updateAnnouncement(
        req.params.id as string,
        req.user!.houseId,
        req.body,
      );
      const response: ApiResponse = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

communicationRouter.delete(
  "/announcements/:id",
  requirePermission("communication", "manageAnnouncements"),
  async (req, res, next) => {
    try {
      await commService.deleteAnnouncement(req.params.id as string, req.user!.houseId);
      const response: ApiResponse = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════
// MENSAJES (Chat)
// ══════════════════════════════════════════════

communicationRouter.get("/messages", requirePermission("communication", "readLimitedHistory"), async (req, res, next) => {
  try {
    const data = await commService.getMessages(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.post("/messages", requirePermission("communication", "sendMessages"), validate(sendMessageSchema), async (req, res, next) => {
  try {
    const data = await commService.createMessage(
      req.user!.houseId,
      req.user!.userId,
      req.body.content,
    );
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// NOTIFICACIONES
// ══════════════════════════════════════════════

communicationRouter.get("/notifications", async (req, res, next) => {
  try {
    const data = await commService.getNotifications(req.user!.houseId, req.user!.userId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.get("/notifications/unread-count", async (req, res, next) => {
  try {
    const count = await commService.getUnreadCount(req.user!.houseId, req.user!.userId);
    const response: ApiResponse = { success: true, data: { count } };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.put("/notifications/:id/read", async (req, res, next) => {
  try {
    await commService.markNotificationRead(req.params.id, req.user!.userId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.put("/notifications/read-all", async (req, res, next) => {
  try {
    await commService.markAllNotificationsRead(req.user!.houseId, req.user!.userId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// PANIC PINGS
// ══════════════════════════════════════════════

communicationRouter.get("/panic", requirePermission("communication", "triggerPanic"), async (req, res, next) => {
  try {
    const data = await commService.getPanicPings(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.post("/panic", requirePermission("communication", "triggerPanic"), async (req, res, next) => {
  try {
    const data = await commService.triggerPanic(
      req.user!.houseId,
      req.user!.userId,
      req.body.message,
    );
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

communicationRouter.put("/panic/:id/resolve", async (req, res, next) => {
  try {
    const data = await commService.resolvePanic(req.params.id, req.user!.userId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
