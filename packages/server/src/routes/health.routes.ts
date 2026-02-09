// ══════════════════════════════════════════════
// Health Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, requirePermission } from "../middleware/auth";
import * as healthService from "../services/health.service";
import type { ApiResponse } from "@homeassistan/shared";

export const healthRouter: RouterType = Router();
healthRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const upsertProfileSchema = z.object({
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]).optional(),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  emergencyNotes: z.string().max(500).optional(),
  doctorName: z.string().max(100).optional(),
  doctorPhone: z.string().max(30).optional(),
  insuranceInfo: z.string().max(200).optional(),
});

const createMedicationSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().min(1).max(150),
  dosage: z.string().max(100).optional(),
  frequency: z
    .enum(["once", "daily", "twice_daily", "three_daily", "weekly", "as_needed"])
    .optional(),
  timeOfDay: z.string().max(20).optional(),
  instructions: z.string().max(500).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateMedicationSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  dosage: z.string().max(100).optional(),
  frequency: z
    .enum(["once", "daily", "twice_daily", "three_daily", "weekly", "as_needed"])
    .optional(),
  timeOfDay: z.string().max(20).optional(),
  instructions: z.string().max(500).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const logMedicationSchema = z.object({
  medicationId: z.string().uuid(),
  wasSkipped: z.boolean().optional(),
  note: z.string().max(300).optional(),
});

const createRoutineSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  timeOfDay: z.string().max(20).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
});

// ══════════════════════════════════════════════
// PERFILES DE SALUD
// ══════════════════════════════════════════════

healthRouter.get("/profiles", requirePermission("health", "viewProfiles"), async (req, res, next) => {
  try {
    const data = await healthService.getHealthProfiles(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

healthRouter.put("/profiles", requirePermission("health", "editOwnProfile"), validate(upsertProfileSchema), async (req, res, next) => {
  try {
    const data = await healthService.upsertHealthProfile(
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

// ══════════════════════════════════════════════
// MEDICAMENTOS
// ══════════════════════════════════════════════

healthRouter.get("/medications", requirePermission("health", "viewMedications"), async (req, res, next) => {
  try {
    const data = await healthService.getMedications(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

healthRouter.post("/medications", requirePermission("health", "manageMedications"), validate(createMedicationSchema), async (req, res, next) => {
  try {
    const data = await healthService.createMedication(req.user!.houseId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

healthRouter.put("/medications/:id", requirePermission("health", "manageMedications"), validate(updateMedicationSchema), async (req, res, next) => {
  try {
    const data = await healthService.updateMedication(
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

healthRouter.delete("/medications/:id", requirePermission("health", "manageMedications"), async (req, res, next) => {
  try {
    await healthService.deleteMedication(req.params.id as string, req.user!.houseId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ── Medication Logs ──────────────────────────

healthRouter.post("/medications/log", requirePermission("health", "logMedication"), validate(logMedicationSchema), async (req, res, next) => {
  try {
    const data = await healthService.logMedication(req.user!.userId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

healthRouter.get("/medications/:id/logs", requirePermission("health", "viewMedications"), async (req, res, next) => {
  try {
    const data = await healthService.getMedicationLogs(req.params.id as string);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// RUTINAS DE SALUD
// ══════════════════════════════════════════════

healthRouter.get("/routines", requirePermission("health", "viewRoutines"), async (req, res, next) => {
  try {
    const data = await healthService.getHealthRoutines(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

healthRouter.post("/routines", requirePermission("health", "manageRoutines"), validate(createRoutineSchema), async (req, res, next) => {
  try {
    const data = await healthService.createHealthRoutine(req.user!.houseId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

healthRouter.delete("/routines/:id", requirePermission("health", "manageRoutines"), async (req, res, next) => {
  try {
    await healthService.deleteHealthRoutine(req.params.id as string, req.user!.houseId);
    const response: ApiResponse = { success: true, data: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
