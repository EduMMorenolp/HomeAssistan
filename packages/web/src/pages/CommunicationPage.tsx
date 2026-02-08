// ══════════════════════════════════════════════
// Communication Page (Anuncios, Chat, Notificaciones, Pánico)
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ApiResponse,
  AnnouncementInfo,
  MessageInfo,
  NotificationInfo,
  PanicPingInfo,
} from "@homeassistan/shared";
import {
  Megaphone,
  MessageCircle,
  Bell,
  AlertTriangle,
  Plus,
  X,
  Pin,
  Send,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";

type Tab = "announcements" | "chat" | "notifications" | "panic";

export function CommunicationPage() {
  const [tab, setTab] = useState<Tab>("announcements");

  const tabs: { key: Tab; label: string; icon: typeof Megaphone }[] = [
    { key: "announcements", label: "Anuncios", icon: Megaphone },
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "notifications", label: "Notificaciones", icon: Bell },
    { key: "panic", label: "Pánico", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
        Comunicación
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "announcements" && <AnnouncementsSection />}
      {tab === "chat" && <ChatSection />}
      {tab === "notifications" && <NotificationsSection />}
      {tab === "panic" && <PanicSection />}
    </div>
  );
}

// ══════════════════════════════════════════════
// ANUNCIOS
// ══════════════════════════════════════════════

function AnnouncementsSection() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");

  const { data: announcements = [] } = useQuery<AnnouncementInfo[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AnnouncementInfo[]>>("/communication/announcements");
      return data.data!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/communication/announcements", { title, content, priority });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Anuncio publicado");
      setShowCreate(false);
      setTitle("");
      setContent("");
      setPriority("normal");
    },
    onError: () => toast.error("Error al publicar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/communication/announcements/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Anuncio eliminado");
    },
  });

  const priorityColors = {
    normal: "border-slate-200 dark:border-slate-700",
    important: "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10",
    urgent: "border-red-400 bg-red-50/50 dark:bg-red-900/10",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Tablón de anuncios</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Nuevo"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del anuncio"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm resize-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="important">Importante</option>
              <option value="urgent">Urgente</option>
            </select>
            <button
              onClick={() => create.mutate()}
              disabled={!title.trim() || !content.trim()}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Publicar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            className={cn(
              "bg-white dark:bg-slate-800 rounded-xl p-4 border",
              priorityColors[a.priority]
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {a.isPinned && <Pin className="w-3.5 h-3.5 text-blue-500" />}
                  <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                  {a.priority !== "normal" && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        a.priority === "urgent"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      )}
                    >
                      {a.priority === "urgent" ? "Urgente" : "Importante"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{a.content}</p>
                <p className="text-xs text-slate-400">
                  Por {a.authorName} · {new Date(a.createdAt).toLocaleDateString("es")}
                </p>
              </div>
              <button
                onClick={() => del.mutate(a.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No hay anuncios</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════

function ChatSection() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");

  const { data: messages = [] } = useQuery<MessageInfo[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MessageInfo[]>>("/communication/messages");
      return data.data!;
    },
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: async () => {
      await api.post("/communication/messages", { content: msg });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      setMsg("");
    },
    onError: () => toast.error("Error al enviar"),
  });

  const sortedMessages = [...messages].reverse();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedMessages.map((m) => (
          <div key={m.id} className="space-y-0.5">
            <p className="text-xs font-medium text-blue-500">{m.senderName}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 inline-block">
              {m.content}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date(m.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin mensajes aún</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (msg.trim()) send.mutate();
        }}
        className="flex gap-2 p-3 border-t border-slate-200 dark:border-slate-700"
      >
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
        />
        <button
          type="submit"
          disabled={!msg.trim()}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════
// NOTIFICACIONES
// ══════════════════════════════════════════════

function NotificationsSection() {
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<NotificationInfo[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<NotificationInfo[]>>("/communication/notifications");
      return data.data!;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/communication/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await api.put("/communication/notifications/read-all");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas marcadas como leídas");
    },
  });

  const typeIcons: Record<string, string> = {
    info: "ℹ️",
    warning: "⚠️",
    task: "✅",
    event: "📅",
    finance: "💰",
    health: "❤️",
    security: "🔒",
    panic: "🚨",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Notificaciones</h2>
        <button
          onClick={() => markAll.mutate()}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          <CheckCheck className="w-4 h-4 inline mr-1" />
          Marcar todas
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "bg-white dark:bg-slate-800 rounded-xl p-3 border flex items-start gap-3",
              n.isRead
                ? "border-slate-200 dark:border-slate-700 opacity-60"
                : "border-blue-200 dark:border-blue-800"
            )}
          >
            <span className="text-lg">{typeIcons[n.type] ?? "📌"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
              {n.body && (
                <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {new Date(n.createdAt).toLocaleString("es")}
              </p>
            </div>
            {!n.isRead && (
              <button
                onClick={() => markRead.mutate(n.id)}
                className="p-1 text-blue-500 hover:text-blue-600"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin notificaciones</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// PÁNICO
// ══════════════════════════════════════════════

function PanicSection() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: pings = [] } = useQuery<PanicPingInfo[]>({
    queryKey: ["panic-pings"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PanicPingInfo[]>>("/communication/panic");
      return data.data!;
    },
    refetchInterval: 3000,
  });

  const trigger = useMutation({
    mutationFn: async () => {
      await api.post("/communication/panic", { message: message || undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panic-pings"] });
      toast.success("¡Alerta enviada!");
      setMessage("");
    },
    onError: () => toast.error("Error al enviar alerta"),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/communication/panic/${id}/resolve`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panic-pings"] });
      toast.success("Alerta resuelta");
    },
  });

  return (
    <div className="space-y-4">
      {/* Botón de pánico */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800 text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
          Botón de Pánico
        </h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80">
          Envía una alerta a todos los miembros del hogar
        </p>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensaje opcional..."
          className="w-full max-w-md mx-auto px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-sm"
        />
        <button
          onClick={() => trigger.mutate()}
          className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
        >
          🚨 ENVIAR ALERTA
        </button>
      </div>

      {/* Historial */}
      <h3 className="font-semibold text-slate-900 dark:text-white">Historial de alertas</h3>
      <div className="space-y-2">
        {pings.map((p) => (
          <div
            key={p.id}
            className={cn(
              "bg-white dark:bg-slate-800 rounded-xl p-3 border flex items-center gap-3",
              p.isResolved
                ? "border-slate-200 dark:border-slate-700"
                : "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
            )}
          >
            <span className="text-lg">{p.isResolved ? "✅" : "🚨"}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {p.triggeredByName}
              </p>
              {p.message && (
                <p className="text-xs text-slate-500">{p.message}</p>
              )}
              <p className="text-[10px] text-slate-400">
                {new Date(p.createdAt).toLocaleString("es")}
              </p>
            </div>
            {!p.isResolved && (
              <button
                onClick={() => resolve.mutate(p.id)}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600"
              >
                Resolver
              </button>
            )}
          </div>
        ))}
        {pings.length === 0 && (
          <p className="text-center py-4 text-slate-400 text-sm">Sin alertas</p>
        )}
      </div>
    </div>
  );
}
