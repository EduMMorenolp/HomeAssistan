import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const houses = pgTable("houses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
  pinHash: varchar("pin_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type House = typeof houses.$inferSelect;
export type NewHouse = typeof houses.$inferInsert;
