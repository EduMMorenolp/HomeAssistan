// ══════════════════════════════════════════════
// Pets Schema — Fichas de mascotas
// ══════════════════════════════════════════════

import { pgTable, uuid, varchar, text, real, date, timestamp } from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

export const pets = pgTable("pets", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  species: varchar("species", { length: 50 }).notNull(), // perro, gato, etc.
  breed: varchar("breed", { length: 100 }),
  birthDate: date("birth_date"),
  weight: real("weight"),
  avatar: text("avatar"),
  allergies: text("allergies"),
  vetName: varchar("vet_name", { length: 100 }),
  vetPhone: varchar("vet_phone", { length: 20 }),
  notes: text("notes"),
  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
