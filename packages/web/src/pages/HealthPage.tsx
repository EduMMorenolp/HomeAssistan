// ══════════════════════════════════════════════
// Health Page (Perfiles, Medicamentos, Rutinas)
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  ApiResponse,
  HealthProfileInfo,
  MedicationInfo,
  MedicationFrequency,
  HealthRoutineInfo,
} from "@homeassistan/shared";
import { BLOOD_TYPE_LABELS, FREQUENCY_LABELS } from "@homeassistan/shared";
import { Heart, Pill, Activity, Plus, X, Trash2, AlertTriangle, User, Check, Pencil } from "lucide-react";

type Tab = "profiles" | "medications" | "routines";

export function HealthPage() {
  const [tab, setTab] = useState<Tab>("medications");

  const tabs: { key: Tab; label: string; icon: typeof Heart }[] = [
    { key: "profiles", label: "Perfiles", icon: User },
    { key: "medications", label: "Medicamentos", icon: Pill },
    { key: "routines", label: "Rutinas", icon: Activity },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Salud</h1>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profiles" && <ProfilesSection />}
      {tab === "medications" && <MedicationsSection />}
      {tab === "routines" && <RoutinesSection />}
    </div>
  );
}

// ══════════════════════════════════════════════
// PERFILES DE SALUD
// ══════════════════════════════════════════════

function ProfilesSection() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bloodType, setBloodType] = useState("unknown");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");

  const { data: profiles = [] } = useQuery<HealthProfileInfo[]>({
    queryKey: ["health-profiles"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HealthProfileInfo[]>>("/health/profiles");
      return data.data!;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      await api.put("/health/profiles", {
        bloodType,
        allergies: allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        conditions: conditions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        emergencyNotes: emergencyNotes || undefined,
        doctorName: doctorName || undefined,
        doctorPhone: doctorPhone || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-profiles"] });
      toast.success("Perfil actualizado");
      setEditing(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Perfiles de salud</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
        >
          {editing ? <X className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
          {editing ? "Cancelar" : "Mi perfil"}
        </button>
      </div>

      {editing && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tipo de sangre</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                {Object.entries(BLOOD_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Doctor</label>
              <input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Nombre del doctor"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <input
            value={doctorPhone}
            onChange={(e) => setDoctorPhone(e.target.value)}
            placeholder="Teléfono del doctor"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Alergias (separadas por coma)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <input
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="Condiciones médicas (separadas por coma)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <textarea
            value={emergencyNotes}
            onChange={(e) => setEmergencyNotes(e.target.value)}
            placeholder="Notas de emergencia"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm resize-none"
          />
          <button
            onClick={() => upsert.mutate()}
            className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
          >
            Guardar perfil
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <User className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900 dark:text-white">{p.userName}</p>
                <p className="text-xs text-slate-500">Sangre: {BLOOD_TYPE_LABELS[p.bloodType]}</p>
              </div>
            </div>
            {p.allergies?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(p.allergies as string[]).map((a, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
            {p.doctorName && (
              <p className="text-xs text-slate-500">
                🩺 {p.doctorName} — {p.doctorPhone}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MEDICAMENTOS
// ══════════════════════════════════════════════

function MedicationsSection() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const [showCreate, setShowCreate] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicationInfo | null>(null);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);

  const { data: meds = [] } = useQuery<MedicationInfo[]>({
    queryKey: ["medications"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MedicationInfo[]>>("/health/medications");
      return data.data!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/health/medications", {
        name,
        dosage: dosage || undefined,
        frequency,
        stock,
        minStock,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medicamento añadido");
      setShowCreate(false);
      setName("");
      setDosage("");
      setStock(0);
    },
    onError: () => toast.error("Error al crear"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/health/medications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medicamento eliminado");
    },
  });

  const logTake = useMutation({
    mutationFn: async (medId: string) => {
      await api.post("/health/medications/log", { medicationId: medId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Toma registrada");
    },
  });

  const updateMed = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      await api.put(`/health/medications/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Medicamento actualizado");
      setEditingMed(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Medicamentos</h2>
        {can("health", "manageMedications") && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? "Cancelar" : "Añadir"}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del medicamento"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Dosis (ej: 500mg)"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(+e.target.value)}
              placeholder="Stock"
              min={0}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(+e.target.value)}
              placeholder="Stock mín."
              min={0}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim()}
            className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Añadir medicamento
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {meds.map((m) => {
          const lowStock = m.stock <= m.minStock;
          return (
            <div
              key={m.id}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl p-4 border",
                lowStock
                  ? "border-orange-300 dark:border-orange-800"
                  : "border-slate-200 dark:border-slate-700",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{m.name}</h3>
                  {m.dosage && <p className="text-xs text-slate-500">{m.dosage}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {FREQUENCY_LABELS[m.frequency]} · {m.userName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {can("health", "logMedication") && (
                    <button
                      onClick={() => logTake.mutate(m.id)}
                      className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                      title="Registrar toma"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {can("health", "manageMedications") && (
                    <button
                      onClick={() => setEditingMed(m)}
                      className="p-1.5 text-slate-400 hover:text-blue-500"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {can("health", "manageMedications") && (
                    <button
                      onClick={() => del.mutate(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    lowStock
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  )}
                >
                  Stock: {m.stock}
                </div>
                {lowStock && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                {!m.isActive && <span className="text-xs text-slate-400">(inactivo)</span>}
              </div>
            </div>
          );
        })}
        {meds.length === 0 && (
          <p className="col-span-2 text-center py-8 text-slate-400 text-sm">Sin medicamentos</p>
        )}
      </div>

      {/* Modal editar medicamento */}
      {editingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Editar medicamento</h3>
              <button onClick={() => setEditingMed(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <EditMedForm
              med={editingMed}
              onSave={(body) => updateMed.mutate({ id: editingMed.id, body })}
              isPending={updateMed.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditMedForm({
  med,
  onSave,
  isPending,
}: {
  med: MedicationInfo;
  onSave: (body: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [f, setF] = useState({
    name: med.name,
    dosage: med.dosage ?? "",
    frequency: med.frequency,
    stock: med.stock,
    minStock: med.minStock,
    isActive: med.isActive,
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nombre" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
        <input value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} placeholder="Dosis" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value as MedicationFrequency })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm">
          {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: +e.target.value })} min={0} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
        <input type="number" value={f.minStock} onChange={(e) => setF({ ...f, minStock: +e.target.value })} min={0} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="rounded" />
        Activo
      </label>
      <button
        onClick={() => onSave({ ...f, dosage: f.dosage || undefined })}
        disabled={isPending || !f.name.trim()}
        className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════
// RUTINAS
// ══════════════════════════════════════════════

function RoutinesSection() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");

  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  const { data: routines = [] } = useQuery<HealthRoutineInfo[]>({
    queryKey: ["health-routines"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HealthRoutineInfo[]>>("/health/routines");
      return data.data!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/health/routines", {
        name,
        description: description || undefined,
        timeOfDay: timeOfDay || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-routines"] });
      toast.success("Rutina creada");
      setShowCreate(false);
      setName("");
      setDescription("");
      setTimeOfDay("");
    },
    onError: () => toast.error("Error al crear"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/health/routines/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["health-routines"] });
      toast.success("Rutina eliminada");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Rutinas de salud</h2>
        {can("health", "manageRoutines") && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? "Cancelar" : "Nueva"}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la rutina"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <input
            type="time"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim()}
            className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Crear rutina
          </button>
        </div>
      )}

      <div className="space-y-3">
        {routines.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{r.name}</h3>
                {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  {r.timeOfDay && <span className="text-xs text-slate-400">🕐 {r.timeOfDay}</span>}
                  <span className="text-xs text-slate-400">· {r.userName}</span>
                </div>
              </div>
              {can("health", "manageRoutines") && (
                <button
                  onClick={() => del.mutate(r.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1 mt-2">
              {dayNames.map((d, i) => (
                <span
                  key={d}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium",
                    (r.daysOfWeek as number[])?.includes(i)
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-700",
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        ))}
        {routines.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin rutinas</p>
        )}
      </div>
    </div>
  );
}
