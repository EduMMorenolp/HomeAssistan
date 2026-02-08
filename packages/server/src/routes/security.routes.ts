// ══════════════════════════════════════════════
// Security Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import * as securityService from "../services/security.service";
import type { ApiResponse } from "@homeassistan/shared";

export const securityRouter: RouterType = Router();
securityRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(30),
  relationship: z.string().max(50).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(300).optional(),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(30).optional(),
  relationship: z.string().max(50).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(300).optional(),
});

const createVaultSchema = z.object({
  category: z.enum([
    "wifi", "alarm", "safe", "insurance", "utility", "subscription", "other",
  ]),
  label: z.string().min(1).max(150),
  value: z.string().min(1).max(500),
  notes: z.string().max(500).optional(),
});

const updateVaultSchema = z.object({
  category: z
    .enum(["wifi", "alarm", "safe", "insurance", "utility", "subscription", "other"])
    .optional(),
  label: z.string().min(1).max(150).optional(),
  value: z.string().min(1).max(500).optional(),
  notes: z.string().max(500).optional(),
});

const createVisitorCodeSchema = z.object({
  label: z.string().max(100).optional(),
  expiresAt: z.string().optional(),
});

// ══════════════════════════════════════════════
// CONTACTOS DE EMERGENCIA
// ══════════════════════════════════════════════

securityRouter.get("/contacts", async (req, res, next) => {
  try {
    const data = await securityService.getEmergencyContacts(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

securityRouter.post(
  "/contacts",
  validate(createContactSchema),
  async (req, res, next) => {
    try {
      const data = await securityService.createEmergencyContact(
        req.user!.houseId,
        req.body,
      );
      const response: ApiResponse = { success: true, data };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
);

securityRouter.put(
  "/contacts/:id",
  validate(updateContactSchema),
  async (req, res, next) => {
    try {
      const data = await securityService.updateEmergencyContact(
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

securityRouter.delete("/contacts/:id", async (req, res, next) => {
  try {
    await securityService.deleteEmergencyContact(
      req.params.id as string,
      req.user!.houseId,
    );
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// BÓVEDA SEGURA
// ══════════════════════════════════════════════

securityRouter.get(
  "/vault",
  authorize("admin", "responsible"),
  async (req, res, next) => {
    try {
      const data = await securityService.getVaultEntries(req.user!.houseId);
      const response: ApiResponse = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

securityRouter.post(
  "/vault",
  authorize("admin", "responsible"),
  validate(createVaultSchema),
  async (req, res, next) => {
    try {
      const data = await securityService.createVaultEntry(
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

securityRouter.put(
  "/vault/:id",
  authorize("admin", "responsible"),
  validate(updateVaultSchema),
  async (req, res, next) => {
    try {
      const data = await securityService.updateVaultEntry(
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

securityRouter.delete(
  "/vault/:id",
  authorize("admin", "responsible"),
  async (req, res, next) => {
    try {
      await securityService.deleteVaultEntry(req.params.id as string, req.user!.houseId);
      const response: ApiResponse = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════
// CÓDIGOS DE VISITANTE
// ══════════════════════════════════════════════

securityRouter.get("/visitor-codes", async (req, res, next) => {
  try {
    const data = await securityService.getVisitorCodes(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

securityRouter.post(
  "/visitor-codes",
  authorize("admin", "responsible"),
  validate(createVisitorCodeSchema),
  async (req, res, next) => {
    try {
      const data = await securityService.generateVisitorCode(
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

securityRouter.delete(
  "/visitor-codes/:id",
  authorize("admin", "responsible"),
  async (req, res, next) => {
    try {
      await securityService.deleteVisitorCode(
        req.params.id as string,
        req.user!.houseId,
      );
      const response: ApiResponse = { success: true, data: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

// ══════════════════════════════════════════════
// LOGS DE ACCESO
// ══════════════════════════════════════════════

securityRouter.get(
  "/access-logs",
  authorize("admin"),
  async (req, res, next) => {
    try {
      const data = await securityService.getAccessLogs(req.user!.houseId);
      const response: ApiResponse = { success: true, data };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);
