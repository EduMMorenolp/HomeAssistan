import { pgTable, uuid, varchar, timestamp, pgEnum, primaryKey } from "drizzle-orm/pg-core";
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
    nickname: varchar("nickname", { length: 50 }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.houseId, table.userId] }),
  }),
);

export type HouseMember = typeof houseMembers.$inferSelect;
export type NewHouseMember = typeof houseMembers.$inferInsert;
