// ══════════════════════════════════════════════
// Calendar Page
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
} from "lucide-react";

export function CalendarPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());

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
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EventInfo[]>>("/calendar");
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
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error("Error al crear evento"),
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
    setTitle("");
    setDescription("");
    setType("general");
    setStartDate("");
    setEndDate("");
    setAllDay(false);
    setLocation("");
    setRecurrence("none");
  }

  // ── Calendar helpers ───────────────────────
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  function prevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  function getEventsForDay(day: number) {
    const date = new Date(year, month, day);
    return events.filter((e) => {
      const start = new Date(e.startDate);
      return (
        start.getFullYear() === date.getFullYear() &&
        start.getMonth() === date.getMonth() &&
        start.getDate() === date.getDate()
      );
    });
  }

  const selectedDayEvents = events.filter((e) => {
    const start = new Date(e.startDate);
    return (
      start.getFullYear() === selectedDate.getFullYear() &&
      start.getMonth() === selectedDate.getMonth() &&
      start.getDate() === selectedDate.getDate()
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Calendario
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Nuevo evento"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
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
                <option key={k} value={k}>{v}</option>
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
            onClick={() => create.mutate()}
            disabled={!title.trim() || !startDate}
            className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Crear evento
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mini calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h3>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
              <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
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
                    isToday && !isSelected && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold",
                    !isSelected && !isToday && "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: e.color || EVENT_TYPE_COLORS[e.type] || "#3b82f6" }}
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
            {selectedDate.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
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
                      ? new Date(e.startDate).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
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
                <button
                  onClick={() => del.mutate(e.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
