// ══════════════════════════════════════════════
// Schema: Comunicación (Muro, Chat, Notificaciones)
// ══════════════════════════════════════════════

import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

// ── Anuncios (muro de la casa) ───────────────
export const announcementPriorityEnum = pgEnum("announcement_priority", [
  "normal",
  "important",
  "urgent",
]);

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  priority: announcementPriorityEnum("priority").default("normal").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

// ── Mensajes (chat interno) ──────────────────
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// ── Notificaciones ───────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "warning",
  "task",
  "event",
  "finance",
  "health",
  "security",
  "panic",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: notificationTypeEnum("type").default("info").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  isRead: boolean("is_read").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// ── Botón de pánico ──────────────────────────
export const panicPings = pgTable("panic_pings", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  triggeredBy: uuid("triggered_by").references(() => users.id, { onDelete: "set null" }),
  message: text("message"),
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PanicPing = typeof panicPings.$inferSelect;
export type NewPanicPing = typeof panicPings.$inferInsert;
