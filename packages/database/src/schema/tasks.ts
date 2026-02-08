// ══════════════════════════════════════════════
// Schema: Tasks (Tareas del hogar)
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
  date,
} from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { users } from "./users";

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

export const taskRecurrenceEnum = pgEnum("task_recurrence", [
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

// ── Tareas ───────────────────────────────────
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  status: taskStatusEnum("status").default("pending").notNull(),
  category: varchar("category", { length: 50 }),
  dueDate: date("due_date"),
  recurrence: taskRecurrenceEnum("recurrence").default("none").notNull(),
  points: integer("points").default(10).notNull(),
  createdBy: uuid("created_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// ── Asignaciones ─────────────────────────────
export const taskAssignments = pgTable("task_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type NewTaskAssignment = typeof taskAssignments.$inferInsert;

// ── Completados (historial) ──────────────────
export const taskCompletions = pgTable("task_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  completedBy: uuid("completed_by")
    .references(() => users.id, { onDelete: "set null" }),
  pointsEarned: integer("points_earned").default(0).notNull(),
  note: text("note"),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type NewTaskCompletion = typeof taskCompletions.$inferInsert;

// ── Rotaciones ───────────────────────────────
export const taskRotations = pgTable("task_rotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  memberIds: text("member_ids").notNull(), // JSON array de user IDs
  currentIndex: integer("current_index").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type TaskRotation = typeof taskRotations.$inferSelect;
export type NewTaskRotation = typeof taskRotations.$inferInsert;

// ── Puntos de gamificación ───────────────────
export const userPoints = pgTable("user_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  houseId: uuid("house_id")
    .references(() => houses.id, { onDelete: "cascade" })
    .notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  weeklyPoints: integer("weekly_points").default(0).notNull(),
  monthlyPoints: integer("monthly_points").default(0).notNull(),
  tasksCompleted: integer("tasks_completed").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type UserPoints = typeof userPoints.$inferSelect;
export type NewUserPoints = typeof userPoints.$inferInsert;
