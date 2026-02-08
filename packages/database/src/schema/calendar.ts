// ══════════════════════════════════════════════
// Schema: Calendario (Eventos)
// ══════════════════════════════════════════════

import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

export const eventTypeEnum = pgEnum("event_type", [
  "general",
  "birthday",
  "appointment",
  "reminder",
  "holiday",
  "maintenance",
  "other",
]);

export const eventRecurrenceEnum = pgEnum("event_recurrence", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

// ── Eventos ──────────────────────────────────
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: eventTypeEnum("type").default("general").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  allDay: boolean("all_day").default(false).notNull(),
  recurrence: eventRecurrenceEnum("recurrence").default("none").notNull(),
  location: varchar("location", { length: 200 }),
  color: varchar("color", { length: 7 }), // hex color
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// ── Asistentes ───────────────────────────────
export const eventStatusEnum = pgEnum("event_attendee_status", ["pending", "accepted", "declined"]);

export const eventAttendees = pgTable("event_attendees", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: eventStatusEnum("status").default("pending").notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export type EventAttendee = typeof eventAttendees.$inferSelect;
export type NewEventAttendee = typeof eventAttendees.$inferInsert;
