// ══════════════════════════════════════════════
// Security Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize, requirePermission } from "../middleware/auth";
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
  category: z.enum(["wifi", "alarm", "safe", "insurance", "utility", "subscription", "other"]),
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

securityRouter.get("/contacts", requirePermission("security", "viewContacts"), async (req, res, next) => {
  try {
    const data = await securityService.getEmergencyContacts(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

securityRouter.post("/contacts", requirePermission("security", "manageContacts"), validate(createContactSchema), async (req, res, next) => {
  try {
    const data = await securityService.createEmergencyContact(req.user!.houseId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

securityRouter.put("/contacts/:id", requirePermission("security", "manageContacts"), validate(updateContactSchema), async (req, res, next) => {
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
});

securityRouter.delete("/contacts/:id", requirePermission("security", "manageContacts"), async (req, res, next) => {
  try {
    await securityService.deleteEmergencyContact(req.params.id as string, req.user!.houseId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// BÓVEDA SEGURA
// ══════════════════════════════════════════════

securityRouter.get("/vault", requirePermission("security", "manageVault"), async (req, res, next) => {
  try {
    const data = await securityService.getVaultEntries(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

securityRouter.post(
  "/vault",
  requirePermission("security", "manageVault"),
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
  requirePermission("security", "manageVault"),
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

securityRouter.delete("/vault/:id", requirePermission("security", "manageVault"), async (req, res, next) => {
  try {
    await securityService.deleteVaultEntry(req.params.id as string, req.user!.houseId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// CÓDIGOS DE VISITANTE
// ══════════════════════════════════════════════

securityRouter.get("/visitor-codes", requirePermission("security", "viewVisitorCodes"), async (req, res, next) => {
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
  requirePermission("security", "manageVisitorCodes"),
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
  requirePermission("security", "manageVisitorCodes"),
  async (req, res, next) => {
    try {
      await securityService.deleteVisitorCode(req.params.id as string, req.user!.houseId);
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

securityRouter.get("/access-logs", requirePermission("security", "viewAccessLogs"), async (req, res, next) => {
  try {
    const data = await securityService.getAccessLogs(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
