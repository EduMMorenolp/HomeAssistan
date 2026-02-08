// ══════════════════════════════════════════════
// Tipos de Comunicación
// ══════════════════════════════════════════════

export type AnnouncementPriority = "normal" | "important" | "urgent";
export type NotificationType =
  | "info"
  | "warning"
  | "task"
  | "event"
  | "finance"
  | "health"
  | "security"
  | "panic";

export interface AnnouncementInfo {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  authorId?: string | null;
  authorName?: string;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  isPinned?: boolean;
}

export interface MessageInfo {
  id: string;
  content: string;
  senderId?: string | null;
  senderName?: string;
  isEdited: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface NotificationInfo {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface PanicPingInfo {
  id: string;
  triggeredBy?: string | null;
  triggeredByName?: string;
  message?: string | null;
  isResolved: boolean;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  normal: "Normal",
  important: "Importante",
  urgent: "Urgente",
};
