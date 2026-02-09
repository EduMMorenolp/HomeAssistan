// ══════════════════════════════════════════════
// Admin Service — System administration operations
// ══════════════════════════════════════════════

import { eq, desc, count, and, gte } from "drizzle-orm";
import {
  db,
  houses,
  users,
  houseMembers,
  sessions,
  activityLogs,
  systemConfig,
} from "@homeassistan/database";

// ── System Stats ──────────────────────────────

export async function getSystemStats() {
  const [[housesCount], [usersCount], [activeSessions]] = await Promise.all([
    db.select({ total: count() }).from(houses),
    db.select({ total: count() }).from(users),
    db
      .select({ total: count() })
      .from(sessions)
      .where(
        and(
          eq(sessions.isRevoked, false),
          gte(sessions.expiresAt, new Date()),
        ),
      ),
  ]);

  return {
    totalHouses: housesCount.total,
    totalUsers: usersCount.total,
    activeSessions: activeSessions.total,
  };
}

// ── All Users (cross-house) ───────────────────

export async function getAllUsers() {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      profileType: users.profileType,
      createdAt: users.createdAt,
      houseId: houseMembers.houseId,
      houseName: houses.name,
      role: houseMembers.role,
      joinedAt: houseMembers.joinedAt,
    })
    .from(users)
    .leftJoin(houseMembers, eq(users.id, houseMembers.userId))
    .leftJoin(houses, eq(houseMembers.houseId, houses.id))
    .orderBy(desc(users.createdAt));

  return result;
}

// ── Change User Role (admin-level) ────────────

export async function changeUserRole(
  userId: string,
  houseId: string,
  newRole: string,
) {
  const [updated] = await db
    .update(houseMembers)
    .set({ role: newRole as typeof houseMembers.$inferInsert.role })
    .where(
      and(eq(houseMembers.userId, userId), eq(houseMembers.houseId, houseId)),
    )
    .returning();

  return updated;
}

// ── Activity Logs ─────────────────────────────

export async function getActivityLogs(
  limit = 50,
  offset = 0,
  houseId?: string,
) {
  const conditions = houseId
    ? eq(activityLogs.houseId, houseId)
    : undefined;

  const logs = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      entity: activityLogs.entity,
      entityId: activityLogs.entityId,
      details: activityLogs.details,
      userId: activityLogs.userId,
      userName: users.name,
      houseId: activityLogs.houseId,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(conditions)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityLogs)
    .where(conditions);

  return { logs, total, limit, offset };
}

// ── System Config ─────────────────────────────

export async function getSystemConfig() {
  return db.select().from(systemConfig).orderBy(systemConfig.key);
}

export async function updateSystemConfig(key: string, value: string) {
  const [updated] = await db
    .update(systemConfig)
    .set({ value, updatedAt: new Date() })
    .where(eq(systemConfig.key, key))
    .returning();

  return updated;
}

// ── Force Logout ──────────────────────────────

export async function revokeUserSessions(userId: string) {
  await db
    .update(sessions)
    .set({ isRevoked: true })
    .where(eq(sessions.userId, userId));
}

// ── Log Activity ──────────────────────────────

export async function logActivity(
  action: string,
  userId: string,
  houseId: string,
  entity: string,
  entityId?: string,
  details?: string,
) {
  await db.insert(activityLogs).values({
    action,
    userId,
    houseId,
    entity,
    entityId,
    details,
  });
}
