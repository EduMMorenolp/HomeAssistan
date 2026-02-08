// ══════════════════════════════════════════════
// Finance Service
// ══════════════════════════════════════════════

import { eq, and, desc, gte, sql } from "drizzle-orm";
import { db, expenses, shoppingItems, householdItems, users } from "@homeassistan/database";
import type {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateShoppingItemRequest,
  CreateHouseholdItemRequest,
  UpdateHouseholdItemRequest,
} from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

// ══════════════════════════════════════════════
// GASTOS
// ══════════════════════════════════════════════

export async function getExpenses(houseId: string) {
  return db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      category: expenses.category,
      paidBy: expenses.paidBy,
      paidByName: users.name,
      receiptUrl: expenses.receiptUrl,
      note: expenses.note,
      expenseDate: expenses.expenseDate,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.paidBy, users.id))
    .where(eq(expenses.houseId, houseId))
    .orderBy(desc(expenses.expenseDate));
}

export async function getExpenseSummary(houseId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Total del mes
  const [monthResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}::numeric), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.houseId, houseId), gte(expenses.expenseDate, startOfMonth)));

  // Total de la semana
  const [weekResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${expenses.amount}::numeric), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.houseId, houseId), gte(expenses.expenseDate, startOfWeek)));

  // Por categoría (mes actual)
  const byCategory = await db
    .select({
      category: expenses.category,
      total: sql<string>`SUM(${expenses.amount}::numeric)`,
    })
    .from(expenses)
    .where(and(eq(expenses.houseId, houseId), gte(expenses.expenseDate, startOfMonth)))
    .groupBy(expenses.category)
    .orderBy(desc(sql`SUM(${expenses.amount}::numeric)`));

  // Últimos gastos
  const recentExpenses = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      category: expenses.category,
      paidBy: expenses.paidBy,
      paidByName: users.name,
      expenseDate: expenses.expenseDate,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.paidBy, users.id))
    .where(eq(expenses.houseId, houseId))
    .orderBy(desc(expenses.expenseDate))
    .limit(5);

  return {
    totalMonth: parseFloat(monthResult.total),
    totalWeek: parseFloat(weekResult.total),
    byCategory: byCategory.map((c) => ({
      category: c.category,
      total: parseFloat(c.total),
    })),
    recentExpenses,
  };
}

export async function createExpense(houseId: string, userId: string, data: CreateExpenseRequest) {
  const [expense] = await db
    .insert(expenses)
    .values({
      houseId,
      description: data.description,
      amount: String(data.amount),
      category: data.category || "other",
      paidBy: data.paidBy || userId,
      receiptUrl: data.receiptUrl,
      note: data.note,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
    })
    .returning();

  return expense;
}

export async function updateExpense(expenseId: string, data: UpdateExpenseRequest) {
  const updateData: Record<string, unknown> = {};

  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = String(data.amount);
  if (data.category !== undefined) updateData.category = data.category;
  if (data.note !== undefined) updateData.note = data.note;

  const [expense] = await db
    .update(expenses)
    .set(updateData)
    .where(eq(expenses.id, expenseId))
    .returning();

  if (!expense) {
    throw new AppError(404, "EXPENSE_NOT_FOUND", "Gasto no encontrado");
  }
  return expense;
}

export async function deleteExpense(expenseId: string) {
  const [expense] = await db
    .delete(expenses)
    .where(eq(expenses.id, expenseId))
    .returning({ id: expenses.id });

  if (!expense) {
    throw new AppError(404, "EXPENSE_NOT_FOUND", "Gasto no encontrado");
  }
}

// ══════════════════════════════════════════════
// LISTA DE COMPRAS
// ══════════════════════════════════════════════

export async function getShoppingList(houseId: string) {
  return db
    .select({
      id: shoppingItems.id,
      name: shoppingItems.name,
      quantity: shoppingItems.quantity,
      unit: shoppingItems.unit,
      category: shoppingItems.category,
      estimatedPrice: shoppingItems.estimatedPrice,
      isPurchased: shoppingItems.isPurchased,
      addedBy: shoppingItems.addedBy,
      addedByName: users.name,
      purchasedBy: shoppingItems.purchasedBy,
      createdAt: shoppingItems.createdAt,
    })
    .from(shoppingItems)
    .leftJoin(users, eq(shoppingItems.addedBy, users.id))
    .where(eq(shoppingItems.houseId, houseId))
    .orderBy(shoppingItems.isPurchased, desc(shoppingItems.createdAt));
}

export async function addShoppingItem(
  houseId: string,
  userId: string,
  data: CreateShoppingItemRequest,
) {
  const [item] = await db
    .insert(shoppingItems)
    .values({
      houseId,
      name: data.name,
      quantity: data.quantity ?? 1,
      unit: data.unit,
      category: data.category,
      estimatedPrice: data.estimatedPrice ? String(data.estimatedPrice) : undefined,
      addedBy: userId,
    })
    .returning();

  return item;
}

export async function toggleShoppingItem(itemId: string, userId: string) {
  const [item] = await db.select().from(shoppingItems).where(eq(shoppingItems.id, itemId)).limit(1);

  if (!item) {
    throw new AppError(404, "ITEM_NOT_FOUND", "Artículo no encontrado");
  }

  const [updated] = await db
    .update(shoppingItems)
    .set({
      isPurchased: !item.isPurchased,
      purchasedBy: !item.isPurchased ? userId : null,
      purchasedAt: !item.isPurchased ? new Date() : null,
    })
    .where(eq(shoppingItems.id, itemId))
    .returning();

  return updated;
}

export async function deleteShoppingItem(itemId: string) {
  const [item] = await db
    .delete(shoppingItems)
    .where(eq(shoppingItems.id, itemId))
    .returning({ id: shoppingItems.id });

  if (!item) {
    throw new AppError(404, "ITEM_NOT_FOUND", "Artículo no encontrado");
  }
}

export async function clearPurchasedItems(houseId: string) {
  return db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.houseId, houseId), eq(shoppingItems.isPurchased, true)));
}

// ══════════════════════════════════════════════
// INVENTARIO DEL HOGAR
// ══════════════════════════════════════════════

export async function getInventory(houseId: string) {
  return db
    .select()
    .from(householdItems)
    .where(eq(householdItems.houseId, houseId))
    .orderBy(householdItems.name);
}

export async function createInventoryItem(houseId: string, data: CreateHouseholdItemRequest) {
  const quantity = data.quantity ?? 1;
  const minQuantity = data.minQuantity ?? 0;

  const [item] = await db
    .insert(householdItems)
    .values({
      houseId,
      name: data.name,
      category: data.category,
      location: data.location,
      quantity,
      minQuantity,
      unit: data.unit,
      isLow: quantity <= minQuantity,
    })
    .returning();

  return item;
}

export async function updateInventoryItem(itemId: string, data: UpdateHouseholdItemRequest) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity;
  if (data.unit !== undefined) updateData.unit = data.unit;

  // Recalcular isLow
  if (data.quantity !== undefined || data.minQuantity !== undefined) {
    const [current] = await db
      .select()
      .from(householdItems)
      .where(eq(householdItems.id, itemId))
      .limit(1);

    if (current) {
      const qty = data.quantity ?? current.quantity;
      const min = data.minQuantity ?? current.minQuantity;
      updateData.isLow = qty <= min;
    }
  }

  const [item] = await db
    .update(householdItems)
    .set(updateData)
    .where(eq(householdItems.id, itemId))
    .returning();

  if (!item) {
    throw new AppError(404, "ITEM_NOT_FOUND", "Artículo no encontrado");
  }
  return item;
}

export async function deleteInventoryItem(itemId: string) {
  const [item] = await db
    .delete(householdItems)
    .where(eq(householdItems.id, itemId))
    .returning({ id: householdItems.id });

  if (!item) {
    throw new AppError(404, "ITEM_NOT_FOUND", "Artículo no encontrado");
  }
}
