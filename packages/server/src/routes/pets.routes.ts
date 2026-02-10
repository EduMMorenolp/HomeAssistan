// ══════════════════════════════════════════════
// Pets Routes — CRUD de mascotas
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize, belongsToHouse } from "../middleware/auth";
import * as petsService from "../services/pets.service";
import type { ApiResponse } from "@homeassistan/shared";

export const petsRouter: RouterType = Router();

// ── Schemas ──────────────────────────────────

const createPetSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(50),
  breed: z.string().max(100).optional(),
  birthDate: z.string().optional(),
  weight: z.number().positive().optional(),
  avatar: z.string().optional(),
  allergies: z.string().optional(),
  vetName: z.string().max(100).optional(),
  vetPhone: z.string().max(20).optional(),
  notes: z.string().optional(),
});

const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.string().min(1).max(50).optional(),
  breed: z.string().max(100).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  avatar: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  vetName: z.string().max(100).nullable().optional(),
  vetPhone: z.string().max(20).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ── GET /api/pets — Listar mascotas de la casa ──
petsRouter.get(
  "/",
  authenticate,
  authorize("admin", "responsible", "member"),
  belongsToHouse(),
  async (req, res, next) => {
    try {
      const houseId = req.user!.houseId;
      const petsList = await petsService.getPetsByHouse(houseId);

      const response: ApiResponse = {
        success: true,
        data: petsList,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/pets/:id — Detalle de mascota ──
petsRouter.get(
  "/:id",
  authenticate,
  authorize("admin", "responsible", "member"),
  belongsToHouse(),
  async (req, res, next) => {
    try {
      const houseId = req.user!.houseId;
      const pet = await petsService.getPetById(req.params.id as string, houseId);

      const response: ApiResponse = {
        success: true,
        data: pet,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/pets — Crear mascota ──
petsRouter.post(
  "/",
  authenticate,
  authorize("admin", "responsible", "member"),
  belongsToHouse(),
  validate(createPetSchema),
  async (req, res, next) => {
    try {
      const houseId = req.user!.houseId;
      const userId = req.user!.userId;

      const pet = await petsService.createPet({
        ...req.body,
        houseId,
        createdBy: userId,
      });

      const response: ApiResponse = {
        success: true,
        data: pet,
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/pets/:id — Actualizar mascota ──
petsRouter.patch(
  "/:id",
  authenticate,
  authorize("admin", "responsible", "member"),
  belongsToHouse(),
  validate(updatePetSchema),
  async (req, res, next) => {
    try {
      const houseId = req.user!.houseId;
      const pet = await petsService.updatePet(req.params.id as string, houseId, req.body);

      const response: ApiResponse = {
        success: true,
        data: pet,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/pets/:id — Eliminar mascota ──
petsRouter.delete(
  "/:id",
  authenticate,
  authorize("admin", "responsible"),
  belongsToHouse(),
  async (req, res, next) => {
    try {
      const houseId = req.user!.houseId;
      await petsService.deletePet(req.params.id as string, houseId);

      const response: ApiResponse = {
        success: true,
        data: { message: "Mascota eliminada correctamente" },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
);
