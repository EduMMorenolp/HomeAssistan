// ══════════════════════════════════════════════
// Calendar Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as calendarService from "../services/calendar.service";
import type { ApiResponse } from "@homeassistan/shared";

export const calendarRouter: RouterType = Router();
calendarRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z
    .enum(["general", "birthday", "appointment", "reminder", "holiday", "maintenance", "other"])
    .optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  allDay: z.boolean().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
  location: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
  attendeeIds: z.array(z.string().uuid()).optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z
    .enum(["general", "birthday", "appointment", "reminder", "holiday", "maintenance", "other"])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  allDay: z.boolean().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
  location: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
});

const respondSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

// ── Routes ───────────────────────────────────

calendarRouter.get("/", async (req, res, next) => {
  try {
    const data = await calendarService.getEvents(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

calendarRouter.get("/:id", async (req, res, next) => {
  try {
    const data = await calendarService.getEventById(
      req.params.id,
      req.user!.houseId,
    );
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

calendarRouter.post(
  "/",
  validate(createEventSchema),
  async (req, res, next) => {
    try {
      const data = await calendarService.createEvent(
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

calendarRouter.put(
  "/:id",
  validate(updateEventSchema),
  async (req, res, next) => {
    try {
      const data = await calendarService.updateEvent(
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

calendarRouter.delete("/:id", async (req, res, next) => {
  try {
    await calendarService.deleteEvent(req.params.id as string, req.user!.houseId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

calendarRouter.put(
  "/:id/respond",
  validate(respondSchema),
  async (req, res, next) => {
    try {
      await calendarService.respondToEvent(
        req.params.id as string,
        req.user!.userId,
        req.body.status,
      );
      const response: ApiResponse = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);
