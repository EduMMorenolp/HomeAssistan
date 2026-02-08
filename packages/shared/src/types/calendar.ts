// ══════════════════════════════════════════════
// Tipos de Calendario
// ══════════════════════════════════════════════

export type EventType =
  | "general"
  | "birthday"
  | "appointment"
  | "reminder"
  | "holiday"
  | "maintenance"
  | "other";
export type EventRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type EventAttendeeStatus = "pending" | "accepted" | "declined";

export interface EventInfo {
  id: string;
  title: string;
  description?: string | null;
  type: EventType;
  startDate: string;
  endDate?: string | null;
  allDay: boolean;
  recurrence: EventRecurrence;
  location?: string | null;
  color?: string | null;
  createdBy?: string | null;
  createdByName?: string;
  attendees?: EventAttendeeInfo[];
  createdAt: string;
}

export interface EventAttendeeInfo {
  eventId: string;
  userId: string;
  userName?: string;
  status: EventAttendeeStatus;
  respondedAt?: string | null;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type?: EventType;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  recurrence?: EventRecurrence;
  location?: string;
  color?: string;
  attendeeIds?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  type?: EventType;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  recurrence?: EventRecurrence;
  location?: string;
  color?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  general: "General",
  birthday: "Cumpleaños",
  appointment: "Cita",
  reminder: "Recordatorio",
  holiday: "Festivo",
  maintenance: "Mantenimiento",
  other: "Otro",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  general: "#3b82f6",
  birthday: "#ec4899",
  appointment: "#8b5cf6",
  reminder: "#f59e0b",
  holiday: "#10b981",
  maintenance: "#6b7280",
  other: "#06b6d4",
};
