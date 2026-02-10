// ══════════════════════════════════════════════
// House Members Page — Gestión de miembros
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import type { ApiResponse } from "@homeassistan/shared";
import { ROLE_LABELS, ROLE_HIERARCHY, type Role } from "@homeassistan/shared";
import {
  Users,
  ArrowLeft,
  Plus,
  X,
  Trash2,
  ChevronDown,
  UserPlus,
  Mail,
  Check,
  XCircle,
  Clock,
} from "lucide-react";

interface HouseMember {
  userId: string;
  name: string;
  email: string | null;
  avatar: string | null;
  profileType: string;
  role: string;
  nickname: string | null;
  joinedAt: string;
  memberStatus?: string;
}

interface PendingRequest {
  userId: string;
  name: string;
  createdAt: string;
}

export function HouseMembersPage() {
  const qc = useQueryClient();
  const { house, user } = useAuthStore();
  const { isAdmin, role: myRole } = usePermissions();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  // ── Create user form state ──
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("member");

  // ── Invite form state ──
  const [invName, setInvName] = useState("");
  const [invRole, setInvRole] = useState<string>("member");
  const [invTempPin, setInvTempPin] = useState("");

  // ── External access config state ──
  const [extExpiry, setExtExpiry] = useState("");
  const [extDays, setExtDays] = useState<string[]>([]);
  const [extTimeStart, setExtTimeStart] = useState("08:00");
  const [extTimeEnd, setExtTimeEnd] = useState("18:00");
  const [extModules, setExtModules] = useState<string[]>([]);

  const houseId = house?.id;

  const { data: members = [] } = useQuery<HouseMember[]>({
    queryKey: ["house-members", houseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HouseMember[]>>(
        `/users/house/${houseId}/members`,
      );
      return data.data!;
    },
    enabled: !!houseId,
  });

  const changeRole = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: string;
    }) => {
      await api.patch(`/users/house/${houseId}/members/${userId}/role`, {
        role,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["house-members", houseId] });
      toast.success("Rol actualizado");
      setEditingId(null);
    },
    onError: () => toast.error("Error al cambiar rol"),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/house/${houseId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["house-members", houseId] });
      toast.success("Miembro eliminado de la casa");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      await api.post("/users", {
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        personalPin: newPin,
        houseId,
        role: newUserRole,
        ...(newUserRole === "external" && {
          accessExpiry: extExpiry || undefined,
          accessSchedule:
            extDays.length > 0
              ? { days: extDays, timeStart: extTimeStart, timeEnd: extTimeEnd }
              : undefined,
          allowedModules: extModules.length > 0 ? extModules : undefined,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["house-members", houseId] });
      toast.success("Miembro creado");
      setShowCreate(false);
      setNewName("");
      setNewEmail("");
      setNewPin("");
      setNewUserRole("member");
      setExtExpiry("");
      setExtDays([]);
      setExtModules([]);
    },
    onError: () => toast.error("Error al crear miembro"),
  });

  // ── Pending requests ──
  const { data: pendingRequests = [] } = useQuery<PendingRequest[]>({
    queryKey: ["pending-requests", houseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PendingRequest[]>>(
        "/auth/pending",
      );
      return data.data!;
    },
    enabled: !!houseId,
  });

  // ── Invite member ──
  const inviteMember = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/users/house/${houseId}/invite`, {
        name: invName.trim(),
        role: invRole,
        tempPin: invTempPin,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["house-members", houseId] });
      toast.success("Invitación creada. Comparte el PIN temporal con el nuevo miembro.");
      setShowInvite(false);
      setInvName("");
      setInvRole("member");
      setInvTempPin("");
    },
    onError: () => toast.error("Error al invitar miembro"),
  });

  // ── Approve request ──
  const approveRequest = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/auth/approve/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-requests", houseId] });
      qc.invalidateQueries({ queryKey: ["house-members", houseId] });
      toast.success("Solicitud aprobada");
    },
    onError: () => toast.error("Error al aprobar"),
  });

  // ── Reject request ──
  const rejectRequest = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/auth/reject/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-requests", houseId] });
      toast.success("Solicitud rechazada");
    },
    onError: () => toast.error("Error al rechazar"),
  });

  // Roles that the current user can assign
  const assignableRoles = Object.entries(ROLE_LABELS).filter(([k]) => {
    if (k === "pet") return false;
    if (!isAdmin && (k === "admin" || k === "responsible")) return false;
    return true;
  });

  const canManageMember = (memberRole: string) => {
    return (
      ROLE_HIERARCHY[myRole as Role] > ROLE_HIERARCHY[memberRole as Role]
    );
  };

  const MODULE_OPTIONS = [
    { key: "tasks", label: "Tareas" },
    { key: "finance", label: "Finanzas" },
    { key: "calendar", label: "Calendario" },
    { key: "communication", label: "Comunicación" },
    { key: "health", label: "Salud" },
    { key: "security", label: "Seguridad" },
    { key: "dashboard", label: "Dashboard" },
  ];

  const DAY_OPTIONS = [
    { key: "monday", label: "Lun" },
    { key: "tuesday", label: "Mar" },
    { key: "wednesday", label: "Mié" },
    { key: "thursday", label: "Jue" },
    { key: "friday", label: "Vie" },
    { key: "saturday", label: "Sáb" },
    { key: "sunday", label: "Dom" },
  ];

  const toggleDay = (day: string) => {
    setExtDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleModule = (mod: string) => {
    setExtModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/settings")}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <Users className="w-6 h-6 text-green-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Miembros de {house?.name}
        </h1>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => { setShowInvite(!showInvite); setShowCreate(false); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
        >
          {showInvite ? (
            <X className="w-4 h-4" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {showInvite ? "Cancelar" : "Invitar"}
        </button>
        <button
          onClick={() => { setShowCreate(!showCreate); setShowInvite(false); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          {showCreate ? (
            <X className="w-4 h-4" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {showCreate ? "Cancelar" : "Crear Miembro"}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700/50 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500" />
            Invitar Nuevo Miembro
          </h3>
          <p className="text-xs text-slate-500">
            Se creará una cuenta con un PIN temporal. El invitado deberá cambiar
            su PIN en el primer acceso.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Nombre *
              </label>
              <input
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
                placeholder="Nombre del invitado"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Rol
              </label>
              <select
                value={invRole}
                onChange={(e) => setInvRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                {assignableRoles
                  .filter(([k]) => k !== "admin" && k !== "responsible")
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                PIN temporal *
              </label>
              <input
                type="password"
                value={invTempPin}
                onChange={(e) => setInvTempPin(e.target.value)}
                maxLength={8}
                placeholder="Mín. 4 dígitos"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => inviteMember.mutate()}
            disabled={!invName.trim() || invTempPin.length < 4 || inviteMember.isPending}
            className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              {inviteMember.isPending ? "Invitando..." : "Enviar Invitación"}
            </span>
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Nuevo Miembro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nombre *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email</label>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">PIN (4-8 dígitos) *</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={8}
                placeholder="····"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Rol</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                {assignableRoles.map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* External access config — shown when role = 'external' */}
          {newUserRole === "external" && (
            <ExternalAccessFields
              extExpiry={extExpiry}
              setExtExpiry={setExtExpiry}
              extDays={extDays}
              toggleDay={toggleDay}
              extTimeStart={extTimeStart}
              setExtTimeStart={setExtTimeStart}
              extTimeEnd={extTimeEnd}
              setExtTimeEnd={setExtTimeEnd}
              extModules={extModules}
              toggleModule={toggleModule}
              dayOptions={DAY_OPTIONS}
              moduleOptions={MODULE_OPTIONS}
            />
          )}

          <button
            onClick={() => createUser.mutate()}
            disabled={!newName.trim() || newPin.length < 4}
            className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Miembro
            </span>
          </button>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-700/40 space-y-3">
          <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Solicitudes Pendientes ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.userId}
                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm">
                    {req.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {req.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Solicitado {new Date(req.createdAt).toLocaleDateString("es")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => approveRequest.mutate(req.userId)}
                    disabled={approveRequest.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Rechazar la solicitud de ${req.name}?`)) {
                        rejectRequest.mutate(req.userId);
                      }
                    }}
                    disabled={rejectRequest.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {members.map((m) => {
          const isMe = m.userId === user?.id;
          const canManage = !isMe && canManageMember(m.role);

          return (
            <div
              key={m.userId}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                {m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                    {m.name}
                    {isMe && (
                      <span className="text-xs text-slate-400 ml-1">(tú)</span>
                    )}
                  </p>
                  {m.memberStatus === "invited" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Invitado
                    </span>
                  )}
                  {m.memberStatus === "suspended" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Suspendido
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {m.email ?? "Sin email"} · Desde{" "}
                  {new Date(m.joinedAt).toLocaleDateString("es")}
                </p>
              </div>

              {/* Role badge / editor */}
              {editingId === m.userId ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                  >
                    {assignableRoles.map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      changeRole.mutate({ userId: m.userId, role: newRole })
                    }
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                    m.role === "admin" &&
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    m.role === "responsible" &&
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                    m.role === "member" &&
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    m.role === "simplified" &&
                      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                    m.role === "external" &&
                      "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                  )}
                >
                  {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}
                </span>
              )}

              {/* Actions */}
              {canManage && editingId !== m.userId && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(m.userId);
                      setNewRole(m.role);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Cambiar rol"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar a ${m.name} de la casa? Esto no elimina su cuenta.`,
                        )
                      ) {
                        removeMember.mutate(m.userId);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Eliminar de la casa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin miembros</p>
        )}
      </div>
    </div>
  );
}
// ── Sub-component: External Access Config Fields ──

function ExternalAccessFields({
  extExpiry,
  setExtExpiry,
  extDays,
  toggleDay,
  extTimeStart,
  setExtTimeStart,
  extTimeEnd,
  setExtTimeEnd,
  extModules,
  toggleModule,
  dayOptions,
  moduleOptions,
}: {
  extExpiry: string;
  setExtExpiry: (v: string) => void;
  extDays: string[];
  toggleDay: (d: string) => void;
  extTimeStart: string;
  setExtTimeStart: (v: string) => void;
  extTimeEnd: string;
  setExtTimeEnd: (v: string) => void;
  extModules: string[];
  toggleModule: (m: string) => void;
  dayOptions: { key: string; label: string }[];
  moduleOptions: { key: string; label: string }[];
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 space-y-3">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Configuración de Acceso Externo
      </h4>

      {/* Expiry date */}
      <div>
        <label className="text-xs text-slate-500 mb-1 block">
          Fecha de expiración
        </label>
        <input
          type="date"
          value={extExpiry}
          onChange={(e) => setExtExpiry(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        />
        <p className="text-[10px] text-slate-400 mt-0.5">
          Dejar vacío para acceso sin expiración
        </p>
      </div>

      {/* Days */}
      <div>
        <label className="text-xs text-slate-500 mb-1.5 block">
          Días permitidos
        </label>
        <div className="flex flex-wrap gap-1.5">
          {dayOptions.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDay(d.key)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                extDays.includes(d.key)
                  ? "bg-blue-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Dejar vacío para todos los días
        </p>
      </div>

      {/* Time window */}
      {extDays.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Hora inicio
            </label>
            <input
              type="time"
              value={extTimeStart}
              onChange={(e) => setExtTimeStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Hora fin
            </label>
            <input
              type="time"
              value={extTimeEnd}
              onChange={(e) => setExtTimeEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>
        </div>
      )}

      {/* Allowed modules */}
      <div>
        <label className="text-xs text-slate-500 mb-1.5 block">
          Módulos permitidos
        </label>
        <div className="flex flex-wrap gap-1.5">
          {moduleOptions.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => toggleModule(m.key)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                extModules.includes(m.key)
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Dejar vacío para acceso según permisos del rol
        </p>
      </div>
    </div>
  );
}