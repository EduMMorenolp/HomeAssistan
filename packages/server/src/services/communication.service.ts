// ══════════════════════════════════════════════
// Communication Service
// ══════════════════════════════════════════════

import { eq, and, desc, count } from "drizzle-orm";
import {
  db,
  announcements,
  messages,
  notifications,
  panicPings,
  users,
} from "@homeassistan/database";
import type { CreateAnnouncementRequest, UpdateAnnouncementRequest } from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

// ══════════════════════════════════════════════
// ANUNCIOS
// ══════════════════════════════════════════════

export async function getAnnouncements(houseId: string) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      priority: announcements.priority,
      isPinned: announcements.isPinned,
      authorId: announcements.authorId,
      authorName: users.name,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.authorId, users.id))
    .where(eq(announcements.houseId, houseId))
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

export async function createAnnouncement(
  houseId: string,
  authorId: string,
  data: CreateAnnouncementRequest,
) {
  const [row] = await db
    .insert(announcements)
    .values({
      houseId,
      authorId,
      title: data.title,
      content: data.content,
      priority: data.priority ?? "normal",
      isPinned: data.isPinned ?? false,
    })
    .returning();
  return row;
}

export async function updateAnnouncement(
  id: string,
  houseId: string,
  data: UpdateAnnouncementRequest,
) {
  const [existing] = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.id, id), eq(announcements.houseId, houseId)));
  if (!existing) throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Anuncio no encontrado");

  const [updated] = await db
    .update(announcements)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(announcements.id, id))
    .returning();
  return updated;
}

export async function deleteAnnouncement(id: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.id, id), eq(announcements.houseId, houseId)));
  if (!existing) throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Anuncio no encontrado");

  await db.delete(announcements).where(eq(announcements.id, id));
}

// ══════════════════════════════════════════════
// MENSAJES (Chat)
// ══════════════════════════════════════════════

export async function getMessages(houseId: string, limit = 100) {
  return db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      senderName: users.name,
      isEdited: messages.isEdited,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.houseId, houseId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function createMessage(houseId: string, senderId: string, content: string) {
  const [row] = await db.insert(messages).values({ houseId, senderId, content }).returning();
  return row;
}

// ══════════════════════════════════════════════
// NOTIFICACIONES
// ══════════════════════════════════════════════

export async function getNotifications(houseId: string, userId: string) {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      isRead: notifications.isRead,
      link: notifications.link,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(eq(notifications.houseId, houseId), eq(notifications.userId, userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getUnreadCount(houseId: string, userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.houseId, houseId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
    );
  return result?.count ?? 0;
}

export async function markNotificationRead(id: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(houseId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.houseId, houseId), eq(notifications.userId, userId)));
}

export async function createNotification(
  houseId: string,
  userId: string,
  type: "info" | "warning" | "task" | "event" | "finance" | "health" | "security" | "panic",
  title: string,
  body?: string,
  link?: string,
) {
  const [row] = await db
    .insert(notifications)
    .values({ houseId, userId, type, title, body, link })
    .returning();
  return row;
}

// ══════════════════════════════════════════════
// PANIC PINGS
// ══════════════════════════════════════════════

export async function getPanicPings(houseId: string) {
  return db
    .select({
      id: panicPings.id,
      triggeredBy: panicPings.triggeredBy,
      triggeredByName: users.name,
      message: panicPings.message,
      isResolved: panicPings.isResolved,
      resolvedBy: panicPings.resolvedBy,
      resolvedAt: panicPings.resolvedAt,
      createdAt: panicPings.createdAt,
    })
    .from(panicPings)
    .leftJoin(users, eq(panicPings.triggeredBy, users.id))
    .where(eq(panicPings.houseId, houseId))
    .orderBy(desc(panicPings.createdAt))
    .limit(20);
}

export async function triggerPanic(houseId: string, triggeredBy: string, message?: string) {
  const [row] = await db.insert(panicPings).values({ houseId, triggeredBy, message }).returning();
  return row;
}

export async function resolvePanic(id: string, resolvedBy: string) {
  const [row] = await db
    .update(panicPings)
    .set({ isResolved: true, resolvedBy, resolvedAt: new Date() })
    .where(eq(panicPings.id, id))
    .returning();
  return row;
}
