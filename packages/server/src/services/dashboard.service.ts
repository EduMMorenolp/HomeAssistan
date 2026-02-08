// ══════════════════════════════════════════════
// Dashboard Service
// ══════════════════════════════════════════════

import { eq, and, desc, gte, sql, count } from "drizzle-orm";
import {
  db,
  userPreferences,
  activityLogs,
  tasks,
  events,
  notifications,
  medications,
  expenses,
  users,
  houseMembers,
} from "@homeassistan/database";
import type { UpdatePreferencesRequest } from "@homeassistan/shared";

// ── Stats ────────────────────────────────────

export async function getDashboardStats(houseId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingTasksR] = await db
    .select({ count: count() })
    .from(tasks)
    .where(and(eq(tasks.houseId, houseId), eq(tasks.status, "pending")));

  const [todayEventsR] = await db
    .select({ count: count() })
    .from(events)
    .where(and(eq(events.houseId, houseId), gte(events.startDate, startOfDay)));

  const [membersR] = await db
    .select({ count: count() })
    .from(houseMembers)
    .where(eq(houseMembers.houseId, houseId));

  const [monthExpR] = await db
    .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(eq(expenses.houseId, houseId), gte(expenses.expenseDate, startOfMonth)));

  const [lowStockR] = await db
    .select({ count: count() })
    .from(medications)
    .where(
      and(
        eq(medications.houseId, houseId),
        eq(medications.isActive, true),
        sql`${medications.stock} <= ${medications.minStock}`,
      ),
    );

  return {
    pendingTasks: pendingTasksR?.count ?? 0,
    todayEvents: todayEventsR?.count ?? 0,
    unreadNotifications: 0,
    lowStockMeds: lowStockR?.count ?? 0,
    monthExpenses: parseFloat(monthExpR?.total ?? "0"),
    houseMembersCount: membersR?.count ?? 0,
  };
}

// ── User Preferences ─────────────────────────

export async function getPreferences(userId: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(and(eq(userPreferences.userId, userId), eq(userPreferences.houseId, houseId)));
  if (existing) return existing;

  const [created] = await db.insert(userPreferences).values({ userId, houseId }).returning();
  return created;
}

export async function updatePreferences(
  userId: string,
  houseId: string,
  data: UpdatePreferencesRequest,
) {
  const existing = await getPreferences(userId, houseId);
  const [updated] = await db
    .update(userPreferences)
    .set({ ...data, updatedAt: new Date() } as any)
    .where(eq(userPreferences.id, existing.id))
    .returning();
  return updated;
}

// ── Activity Log ─────────────────────────────

export async function getActivityLog(houseId: string, limit = 50) {
  return db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      userName: users.name,
      action: activityLogs.action,
      entity: activityLogs.entity,
      entityId: activityLogs.entityId,
      details: activityLogs.details,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.houseId, houseId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function logActivity(
  houseId: string,
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  await db.insert(activityLogs).values({
    houseId,
    userId,
    action,
    entity,
    entityId,
    details,
  } as any);
}
