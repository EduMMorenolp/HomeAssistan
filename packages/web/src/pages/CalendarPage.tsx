// ══════════════════════════════════════════════
// Calendar Page
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import type { ApiResponse, EventInfo } from "@homeassistan/shared";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@homeassistan/shared";
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  MapPin,
  Repeat,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";

export function CalendarPage() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // ── Form state ─────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("general");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [recurrence, setRecurrence] = useState("none");

  const { data: events = [] } = useQuery<EventInfo[]>({
    queryKey: ["events", filterFrom, filterTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const { data } = await api.get<ApiResponse<EventInfo[]>>(`/calendar?${params}`);
      return data.data!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/calendar", {
        title,
        description: description || undefined,
        type,
        startDate,
        endDate: endDate || undefined,
        allDay,
        location: location || undefined,
        recurrence,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento creado");
      setShowForm(false);
      resetForm();
    },
    onError: () => toast.error("Error al crear evento"),
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/calendar/${id}`, {
        title,
        description: description || undefined,
        type,
        startDate,
        endDate: endDate || undefined,
        allDay,
        location: location || undefined,
        recurrence,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento actualizado");
      setShowForm(false);
      resetForm();
    },
    onError: () => toast.error("Error al actualizar evento"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/calendar/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento eliminado");
    },
  });

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setType("general");
    setStartDate("");
    setEndDate("");
    setAllDay(false);
    setLocation("");
    setRecurrence("none");
  }

  function startEdit(e: EventInfo) {
    setEditingId(e.id);
    setTitle(e.title);
    setDescription(e.description || "");
    setType(e.type);
    setStartDate(e.startDate.slice(0, 16)); // datetime-local format
    setEndDate(e.endDate ? e.endDate.slice(0, 16) : "");
    setAllDay(e.allDay);
    setLocation(e.location || "");
    setRecurrence(e.recurrence || "none");
    setShowForm(true);
  }

  // ── Calendar helpers ───────────────────────
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  function prevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  function eventOverlapsDay(e: EventInfo, date: Date): boolean {
    const start = new Date(e.startDate);
    start.setHours(0, 0, 0, 0);
    const end = e.endDate ? new Date(e.endDate) : start;
    end.setHours(23, 59, 59, 999);
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d >= start && d <= end;
  }

  function getEventsForDay(day: number) {
    const date = new Date(year, month, day);
    return events.filter((e) => eventOverlapsDay(e, date));
  }

  const selectedDayEvents = events.filter((e) => eventOverlapsDay(e, selectedDate));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Calendario</h1>
        {can("calendar", "createEvent") && (
          <button
            onClick={() => { if (showForm) { setShowForm(false); resetForm(); } else { resetForm(); setShowForm(true); } }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancelar" : "Nuevo evento"}
          </button>
        )}
      </div>

      {/* Filtro de fechas */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="text-slate-500">Desde:</label>
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
        />
        <label className="text-slate-500">Hasta:</label>
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
        />
        {(filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterFrom(""); setFilterTo(""); }}
            className="text-xs text-blue-500 hover:underline"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del evento"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm resize-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Inicio</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Fin (opcional)</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              <option value="none">Sin repetición</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ubicación"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              Todo el día
            </label>
          </div>
          <button
            onClick={() => editingId ? update.mutate(editingId) : create.mutate()}
            disabled={!title.trim() || !startDate}
            className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {editingId ? "Guardar cambios" : "Crear evento"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mini calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
              <div key={d} className="text-xs font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const isSelected =
                day === selectedDate.getDate() &&
                month === selectedDate.getMonth() &&
                year === selectedDate.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={cn(
                    "relative py-1.5 rounded-lg text-sm transition-colors",
                    isSelected && "bg-blue-500 text-white",
                    isToday &&
                      !isSelected &&
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold",
                    !isSelected &&
                      !isToday &&
                      "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
                  )}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: e.color || EVENT_TYPE_COLORS[e.type] || "#3b82f6",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events for selected day */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {selectedDate.toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          {selectedDayEvents.length === 0 && (
            <p className="text-sm text-slate-400">Sin eventos este día</p>
          )}
          {selectedDayEvents.map((e) => (
            <div
              key={e.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: e.color || EVENT_TYPE_COLORS[e.type] || "#3b82f6" }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white">{e.title}</h4>
                  {e.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <CalendarIcon className="w-3 h-3" />
                    {!e.allDay
                      ? new Date(e.startDate).toLocaleTimeString("es", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Todo el día"}
                    {e.location && (
                      <>
                        <MapPin className="w-3 h-3 ml-1" />
                        {e.location}
                      </>
                    )}
                    {e.recurrence !== "none" && (
                      <>
                        <Repeat className="w-3 h-3 ml-1" />
                        {e.recurrence}
                      </>
                    )}
                  </div>
                </div>
                {can("calendar", "editEvent") && (
                  <button
                    onClick={() => startEdit(e)}
                    className="p-1 text-slate-400 hover:text-blue-500"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {can("calendar", "deleteEvent") && (
                  <button
                    onClick={() => del.mutate(e.id)}
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
