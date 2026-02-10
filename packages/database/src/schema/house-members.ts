import { pgTable, uuid, varchar, timestamp, pgEnum, primaryKey, jsonb, text } from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

export const roleEnum = pgEnum("member_role", [
  "admin",
  "responsible",
  "member",
  "simplified",
  "external",
  "pet",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "invited",
  "pending",
  "suspended",
]);

export const houseMembers = pgTable(
  "house_members",
  {
    houseId: uuid("house_id")
      .references(() => houses.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: roleEnum("role").default("member").notNull(),
    memberStatus: memberStatusEnum("member_status").default("active").notNull(),
    nickname: varchar("nickname", { length: 50 }),
    invitedBy: uuid("invited_by").references(() => users.id),
    tempPinHash: varchar("temp_pin_hash", { length: 255 }),
    tempPinExpiry: timestamp("temp_pin_expiry", { withTimezone: true }),
    // ── External access control ──
    accessSchedule: jsonb("access_schedule"),
    // Formato: { days: ['monday','wednesday'], timeStart: '08:00', timeEnd: '18:00' }
    allowedModules: text("allowed_modules").array(),
    // Formato: ['tasks', 'communication']
    accessExpiry: timestamp("access_expiry", { withTimezone: true }),
    // Fecha de expiración del acceso (null = sin expiración)
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.houseId, table.userId] }),
  }),
);

export type HouseMember = typeof houseMembers.$inferSelect;
export type NewHouseMember = typeof houseMembers.$inferInsert;
