// ══════════════════════════════════════════════
// Schema: Finanzas (Gastos, compras, inventario)
// ══════════════════════════════════════════════

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

export const expenseCategoryEnum = pgEnum("expense_category", [
  "food",
  "utilities",
  "maintenance",
  "transport",
  "health",
  "entertainment",
  "education",
  "clothing",
  "other",
]);

// ── Gastos ───────────────────────────────────
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: expenseCategoryEnum("category").default("other").notNull(),
  paidBy: uuid("paid_by").references(() => users.id, { onDelete: "set null" }),
  receiptUrl: text("receipt_url"),
  note: text("note"),
  expenseDate: timestamp("expense_date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

// ── Lista de compras ─────────────────────────
export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 20 }),
  category: varchar("shopping_category", { length: 50 }),
  estimatedPrice: numeric("estimated_price", { precision: 10, scale: 2 }),
  isPurchased: boolean("is_purchased").default(false).notNull(),
  addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
  purchasedBy: uuid("purchased_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }),
});

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type NewShoppingItem = typeof shoppingItems.$inferInsert;

// ── Inventario del hogar ─────────────────────
export const householdItems = pgTable("household_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("item_category", { length: 50 }),
  location: varchar("location", { length: 100 }),
  quantity: integer("quantity").default(1).notNull(),
  minQuantity: integer("min_quantity").default(0).notNull(),
  unit: varchar("unit", { length: 20 }),
  isLow: boolean("is_low").default(false).notNull(),
  lastRestocked: timestamp("last_restocked", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type HouseholdItem = typeof householdItems.$inferSelect;
export type NewHouseholdItem = typeof householdItems.$inferInsert;
