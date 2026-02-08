// ══════════════════════════════════════════════
// Schema: Dashboard & Preferences
// ══════════════════════════════════════════════

import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { houses } from "./houses";

// ── Preferencias de usuario ──────────────────
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  theme: themeEnum("theme").default("system").notNull(),
  language: varchar("language", { length: 10 }).default("es").notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  dashboardLayout: text("dashboard_layout"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

// ── Logs de actividad ────────────────────────
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  details: text("details"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
