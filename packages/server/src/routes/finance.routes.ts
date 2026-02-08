// ══════════════════════════════════════════════
// Finance Routes (Gastos, Compras, Inventario)
// ══════════════════════════════════════════════

import { Router, type Router as RouterType } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import * as financeService from "../services/finance.service";
import type { ApiResponse } from "@homeassistan/shared";

export const financeRouter: RouterType = Router();

// Todas las rutas requieren autenticación
financeRouter.use(authenticate);

// ── Schemas ──────────────────────────────────

const createExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive().max(9999999.99),
  category: z
    .enum([
      "food",
      "utilities",
      "maintenance",
      "transport",
      "health",
      "entertainment",
      "education",
      "clothing",
      "other",
    ])
    .optional(),
  paidBy: z.string().uuid().optional(),
  receiptUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
  expenseDate: z.string().optional(),
});

const updateExpenseSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().max(9999999.99).optional(),
  category: z
    .enum([
      "food",
      "utilities",
      "maintenance",
      "transport",
      "health",
      "entertainment",
      "education",
      "clothing",
      "other",
    ])
    .optional(),
  note: z.string().max(500).optional(),
});

const createShoppingSchema = z.object({
  name: z.string().min(1).max(150),
  quantity: z.number().int().positive().optional(),
  unit: z.string().max(20).optional(),
  category: z.string().max(50).optional(),
  estimatedPrice: z.number().positive().optional(),
});

const createInventorySchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  quantity: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  unit: z.string().max(20).optional(),
});

const updateInventorySchema = z.object({
  name: z.string().min(1).max(150).optional(),
  category: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  quantity: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  unit: z.string().max(20).optional(),
});

// ══════════════════════════════════════════════
// GASTOS
// ══════════════════════════════════════════════

/** Listar gastos */
financeRouter.get("/expenses", async (req, res, next) => {
  try {
    const data = await financeService.getExpenses(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Resumen de gastos */
financeRouter.get("/expenses/summary", async (req, res, next) => {
  try {
    const data = await financeService.getExpenseSummary(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Crear gasto */
financeRouter.post("/expenses", validate(createExpenseSchema), async (req, res, next) => {
  try {
    const data = await financeService.createExpense(req.user!.houseId, req.user!.userId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Actualizar gasto */
financeRouter.patch("/expenses/:id", validate(updateExpenseSchema), async (req, res, next) => {
  try {
    const data = await financeService.updateExpense(req.params.id as string, req.body);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Eliminar gasto */
financeRouter.delete("/expenses/:id", async (req, res, next) => {
  try {
    await financeService.deleteExpense(req.params.id as string);
    const response: ApiResponse = {
      success: true,
      data: { message: "Gasto eliminado" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// LISTA DE COMPRAS
// ══════════════════════════════════════════════

/** Listar compras */
financeRouter.get("/shopping", async (req, res, next) => {
  try {
    const data = await financeService.getShoppingList(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Añadir artículo */
financeRouter.post("/shopping", validate(createShoppingSchema), async (req, res, next) => {
  try {
    const data = await financeService.addShoppingItem(
      req.user!.houseId,
      req.user!.userId,
      req.body,
    );
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Marcar/desmarcar como comprado */
financeRouter.patch("/shopping/:id/toggle", async (req, res, next) => {
  try {
    const data = await financeService.toggleShoppingItem(req.params.id as string, req.user!.userId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Eliminar artículo */
financeRouter.delete("/shopping/:id", async (req, res, next) => {
  try {
    await financeService.deleteShoppingItem(req.params.id as string);
    const response: ApiResponse = {
      success: true,
      data: { message: "Artículo eliminado" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Limpiar comprados */
financeRouter.delete("/shopping/clear/purchased", async (req, res, next) => {
  try {
    await financeService.clearPurchasedItems(req.user!.houseId);
    const response: ApiResponse = {
      success: true,
      data: { message: "Comprados eliminados" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════════
// INVENTARIO
// ══════════════════════════════════════════════

/** Listar inventario */
financeRouter.get("/inventory", async (req, res, next) => {
  try {
    const data = await financeService.getInventory(req.user!.houseId);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Crear artículo de inventario */
financeRouter.post("/inventory", validate(createInventorySchema), async (req, res, next) => {
  try {
    const data = await financeService.createInventoryItem(req.user!.houseId, req.body);
    const response: ApiResponse = { success: true, data };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/** Actualizar artículo de inventario */
financeRouter.patch("/inventory/:id", validate(updateInventorySchema), async (req, res, next) => {
  try {
    const data = await financeService.updateInventoryItem(req.params.id as string, req.body);
    const response: ApiResponse = { success: true, data };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/** Eliminar artículo de inventario */
financeRouter.delete("/inventory/:id", async (req, res, next) => {
  try {
    await financeService.deleteInventoryItem(req.params.id as string);
    const response: ApiResponse = {
      success: true,
      data: { message: "Artículo eliminado" },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
