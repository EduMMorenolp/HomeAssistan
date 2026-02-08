// ══════════════════════════════════════════════
// Schema: Salud (Perfiles, Medicamentos, Rutinas)
// ══════════════════════════════════════════════

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  time,
} from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

// ── Perfiles de salud ────────────────────────
export const bloodTypeEnum = pgEnum("blood_type", [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown",
]);

export const healthProfiles = pgTable("health_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  bloodType: bloodTypeEnum("blood_type").default("unknown").notNull(),
  allergies: text("allergies"), // JSON array
  conditions: text("conditions"), // JSON array
  emergencyNotes: text("emergency_notes"),
  doctorName: varchar("doctor_name", { length: 150 }),
  doctorPhone: varchar("doctor_phone", { length: 30 }),
  insuranceInfo: text("insurance_info"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type HealthProfile = typeof healthProfiles.$inferSelect;
export type NewHealthProfile = typeof healthProfiles.$inferInsert;

// ── Medicamentos ─────────────────────────────
export const frequencyEnum = pgEnum("medication_frequency", [
  "once",
  "daily",
  "twice_daily",
  "three_daily",
  "weekly",
  "as_needed",
]);

export const medications = pgTable("medications", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  frequency: frequencyEnum("frequency").default("daily").notNull(),
  timeOfDay: time("time_of_day"), // e.g. 08:00
  instructions: text("instructions"),
  stock: integer("stock").default(0).notNull(),
  minStock: integer("min_stock").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

// ── Registro de tomas ────────────────────────
export const medicationLogs = pgTable("medication_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  medicationId: uuid("medication_id")
    .references(() => medications.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  takenAt: timestamp("taken_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  wasSkipped: boolean("was_skipped").default(false).notNull(),
  note: text("note"),
});

export type MedicationLog = typeof medicationLogs.$inferSelect;
export type NewMedicationLog = typeof medicationLogs.$inferInsert;

// ── Rutinas de salud ─────────────────────────
export const healthRoutines = pgTable("health_routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  timeOfDay: time("time_of_day"),
  daysOfWeek: varchar("days_of_week", { length: 20 }), // e.g. "1,2,3,4,5"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type HealthRoutine = typeof healthRoutines.$inferSelect;
export type NewHealthRoutine = typeof healthRoutines.$inferInsert;
