// ══════════════════════════════════════════════
// Houses Routes
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import * as housesService from "../services/houses.service";
import type { ApiResponse } from "@homeassistan/shared";

export const housesRouter: RouterType = Router();

// ── Schemas ──────────────────────────────────

const createHouseSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().optional(),
  pin: z.string().min(4).max(8),
});

const updateHouseSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().optional(),
  pin: z.string().min(4).max(8).optional(),
});

// ── Endpoints ────────────────────────────────

/** Listar todas las casas (para pantalla de selección) */
housesRouter.get("/", async (_req, res, next) => {
  try {
    const houses = await housesService.getAllHouses();
    const response: ApiResponse = { success: true, data: houses };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Obtener detalle de una casa */
housesRouter.get("/:id", authenticate, async (req, res, next) => {
  try {
    const house = await housesService.getHouseById(req.params.id as string);
    const response: ApiResponse = { success: true, data: house };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Crear una nueva casa (solo primera vez o admin) */
housesRouter.post("/", validate(createHouseSchema), async (req, res, next) => {
  try {
    const house = await housesService.createHouse(req.body);
    const response: ApiResponse = { success: true, data: house };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Actualizar casa */
housesRouter.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateHouseSchema),
  async (req, res, next) => {
    try {
      const house = await housesService.updateHouse(req.params.id as string, req.body);
      const response: ApiResponse = { success: true, data: house };
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

/** Eliminar casa */
housesRouter.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    await housesService.deleteHouse(req.params.id as string);
    const response: ApiResponse = {
      success: true,
      data: { message: "Casa eliminada" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Obtener miembros de una casa */
housesRouter.get("/:id/members", authenticate, async (req, res, next) => {
  try {
    const members = await housesService.getHouseMembers(req.params.id as string);
    const response: ApiResponse = { success: true, data: members };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
