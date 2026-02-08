// ══════════════════════════════════════════════
// Schema: Seguridad (Emergencias, Bóveda, Accesos)
// ══════════════════════════════════════════════

import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

// ── Contactos de emergencia ──────────────────
export const emergencyContacts = pgTable("emergency_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  relationship: varchar("relationship", { length: 50 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert;

// ── Bóveda segura ────────────────────────────
export const vaultCategoryEnum = pgEnum("vault_category", [
  "wifi",
  "alarm",
  "safe",
  "insurance",
  "utility",
  "subscription",
  "other",
]);

export const secureVault = pgTable("secure_vault", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  category: vaultCategoryEnum("category").default("other").notNull(),
  label: varchar("label", { length: 150 }).notNull(),
  value: text("value").notNull(), // encrypted
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SecureVaultItem = typeof secureVault.$inferSelect;
export type NewSecureVaultItem = typeof secureVault.$inferInsert;

// ── Códigos de visitante ─────────────────────
export const visitorCodes = pgTable("visitor_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  code: varchar("code", { length: 20 }).notNull(),
  label: varchar("label", { length: 150 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type VisitorCode = typeof visitorCodes.$inferSelect;
export type NewVisitorCode = typeof visitorCodes.$inferInsert;

// ── Logs de acceso ───────────────────────────
export const accessActionEnum = pgEnum("access_action", [
  "login",
  "logout",
  "failed_login",
  "house_select",
  "visitor_code_used",
  "panic_triggered",
  "vault_accessed",
]);

export const accessLogs = pgTable("access_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: accessActionEnum("action").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;
export type NewAccessLog = typeof accessLogs.$inferInsert;
