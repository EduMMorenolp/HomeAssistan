// ══════════════════════════════════════════════
// Calendar Service
// ══════════════════════════════════════════════

import { eq, and, desc, gte, lte, between } from "drizzle-orm";
import {
  db,
  events,
  eventAttendees,
  users,
} from "@homeassistan/database";
import type {
  CreateEventRequest,
  UpdateEventRequest,
} from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

// ── CRUD Eventos ─────────────────────────────

export async function getEvents(houseId: string, from?: Date, to?: Date) {
  let query = db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      type: events.type,
      startDate: events.startDate,
      endDate: events.endDate,
      allDay: events.allDay,
      recurrence: events.recurrence,
      location: events.location,
      color: events.color,
      createdBy: events.createdBy,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(eq(events.houseId, houseId))
    .orderBy(desc(events.startDate))
    .$dynamic();

  return query;
}

export async function getEventById(id: string, houseId: string) {
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      type: events.type,
      startDate: events.startDate,
      endDate: events.endDate,
      allDay: events.allDay,
      recurrence: events.recurrence,
      location: events.location,
      color: events.color,
      createdBy: events.createdBy,
      createdAt: events.createdAt,
    })
    .from(events)
    .where(and(eq(events.id, id), eq(events.houseId, houseId)));

  if (!event) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  const attendees = await db
    .select({
      eventId: eventAttendees.eventId,
      userId: eventAttendees.userId,
      userName: users.name,
      status: eventAttendees.status,
      respondedAt: eventAttendees.respondedAt,
    })
    .from(eventAttendees)
    .leftJoin(users, eq(eventAttendees.userId, users.id))
    .where(eq(eventAttendees.eventId, id));

  return { ...event, attendees };
}

export async function createEvent(
  houseId: string,
  createdBy: string,
  data: CreateEventRequest,
) {
  const [event] = await db
    .insert(events)
    .values({
      houseId,
      createdBy,
      title: data.title,
      description: data.description,
      type: data.type ?? "general",
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      allDay: data.allDay ?? false,
      recurrence: data.recurrence ?? "none",
      location: data.location,
      color: data.color,
    })
    .returning();

  if (data.attendeeIds?.length) {
    await db.insert(eventAttendees).values(
      data.attendeeIds.map((userId) => ({
        eventId: event.id,
        userId,
      })),
    );
  }

  return event;
}

export async function updateEvent(
  id: string,
  houseId: string,
  data: UpdateEventRequest,
) {
  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.houseId, houseId)));
  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.allDay !== undefined) updateData.allDay = data.allDay;
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.color !== undefined) updateData.color = data.color;

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(eq(events.id, id))
    .returning();
  return updated;
}

export async function deleteEvent(id: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.houseId, houseId)));
  if (!existing) throw new AppError(404, "EVENT_NOT_FOUND", "Evento no encontrado");

  await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
  await db.delete(events).where(eq(events.id, id));
}

export async function respondToEvent(
  eventId: string,
  userId: string,
  status: "accepted" | "declined",
) {
  await db
    .update(eventAttendees)
    .set({ status, respondedAt: new Date() })
    .where(
      and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId),
      )
    );
}
