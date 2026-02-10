// ══════════════════════════════════════════════
// Admin Page — Panel de Administración
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ApiResponse } from "@homeassistan/shared";
import { ROLE_LABELS } from "@homeassistan/shared";
import {
  BarChart3,
  Users,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  Home,
  LogOut as LogOutIcon,
  ChevronDown,
  Save,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Tab = "stats" | "houses" | "users" | "logs" | "config";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: "stats", label: "Resumen", icon: BarChart3 },
    { key: "houses", label: "Casas", icon: Home },
    { key: "users", label: "Usuarios", icon: Users },
    { key: "logs", label: "Actividad", icon: FileText },
    { key: "config", label: "Configuración", icon: SettingsIcon },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Panel de Administración
        </h1>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
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

      {tab === "stats" && <StatsSection />}
      {tab === "houses" && <HousesSection />}
      {tab === "users" && <UsersSection />}
      {tab === "logs" && <LogsSection />}
      {tab === "config" && <ConfigSection />}
    </div>
  );
}

// ══════════════════════════════════════════════
// RESUMEN / ESTADÍSTICAS
// ══════════════════════════════════════════════

interface SystemStats {
  totalHouses: number;
  totalUsers: number;
  activeSessions: number;
}

function StatsSection() {
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SystemStats>>("/admin/stats");
      return data.data!;
    },
  });

  const statCards = [
    {
      label: "Casas",
      value: stats?.totalHouses ?? "—",
      icon: Home,
      color: "bg-blue-50 dark:bg-blue-900/30",
      iconColor: "text-blue-500",
    },
    {
      label: "Usuarios",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      color: "bg-green-50 dark:bg-green-900/30",
      iconColor: "text-green-500",
    },
    {
      label: "Sesiones activas",
      value: stats?.activeSessions ?? "—",
      icon: ShieldCheck,
      color: "bg-amber-50 dark:bg-amber-900/30",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-900 dark:text-white">Estadísticas del sistema</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  s.color,
                )}
              >
                <s.icon className={cn("w-5 h-5", s.iconColor)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// GESTIÓN DE CASAS
// ══════════════════════════════════════════════

interface AdminHouse {
  id: string;
  name: string;
  address: string | null;
}

function HousesSection() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", pin: "", confirmPin: "" });

  const { data: housesList = [] } = useQuery<AdminHouse[]>({
    queryKey: ["admin-houses"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminHouse[]>>("/houses");
      return data.data!;
    },
  });

  const createHouse = useMutation({
    mutationFn: async (body: { name: string; address?: string; pin: string }) => {
      await api.post("/houses", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-houses"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Casa creada");
      setShowCreate(false);
      setForm({ name: "", address: "", pin: "", confirmPin: "" });
    },
    onError: () => toast.error("Error al crear casa"),
  });

  const deleteHouse = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/houses/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-houses"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Casa eliminada");
    },
    onError: () => toast.error("Error al eliminar casa"),
  });

  const handleCreate = () => {
    if (!form.name.trim()) return toast.error("Nombre requerido");
    if (form.pin.length < 4) return toast.error("PIN mínimo 4 dígitos");
    if (form.pin !== form.confirmPin) return toast.error("Los PINs no coinciden");
    createHouse.mutate({ name: form.name.trim(), address: form.address.trim() || undefined, pin: form.pin });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Casas del sistema ({housesList.length})
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> Crear Casa
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Dirección</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {housesList.map((h) => (
                <tr key={h.id} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{h.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{h.address ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{h.id.slice(0, 8)}…</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la casa "${h.name}"? Se perderán todos los datos asociados.`))
                          deleteHouse.mutate(h.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Eliminar casa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {housesList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin casas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Casa */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Nueva Casa</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre de la casa *"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Dirección (opcional)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <input
                type="password"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value })}
                placeholder="PIN de acceso (4-8 dígitos) *"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                maxLength={8}
              />
              <input
                type="password"
                value={form.confirmPin}
                onChange={(e) => setForm({ ...form, confirmPin: e.target.value })}
                placeholder="Confirmar PIN *"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                maxLength={8}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createHouse.isPending}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {createHouse.isPending ? "Creando…" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// GESTIÓN DE USUARIOS
// ══════════════════════════════════════════════

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  profileType: string;
  createdAt: string;
  houseId: string | null;
  houseName: string | null;
  role: string | null;
  joinedAt: string | null;
}

function UsersSection() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "", email: "", personalPin: "", confirmPin: "",
    profileType: "power" as "power" | "focus",
    houseId: "", role: "member",
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AdminUser[]>>("/admin/users");
      return data.data!;
    },
  });

  const { data: houseOptions = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["admin-houses"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ id: string; name: string }[]>>("/houses");
      return data.data!;
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, houseId, role }: { userId: string; houseId: string; role: string }) => {
      await api.patch(`/admin/users/${userId}/role`, { houseId, role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Rol actualizado");
      setEditingId(null);
    },
    onError: () => toast.error("Error al cambiar rol"),
  });

  const revokeSession = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/revoke`);
    },
    onSuccess: () => toast.success("Sesiones revocadas"),
    onError: () => toast.error("Error al revocar"),
  });

  const createUser = useMutation({
    mutationFn: async (body: {
      name: string; email?: string; personalPin: string;
      profileType: string; houseId: string; role: string;
    }) => {
      await api.post("/users", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Usuario creado");
      setShowCreate(false);
      setUserForm({ name: "", email: "", personalPin: "", confirmPin: "", profileType: "power", houseId: "", role: "member" });
    },
    onError: () => toast.error("Error al crear usuario"),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Usuario eliminado");
    },
    onError: () => toast.error("Error al eliminar usuario"),
  });

  const handleCreateUser = () => {
    if (!userForm.name.trim()) return toast.error("Nombre requerido");
    if (userForm.personalPin.length < 4) return toast.error("PIN mínimo 4 dígitos");
    if (userForm.personalPin !== userForm.confirmPin) return toast.error("Los PINs no coinciden");
    if (!userForm.houseId) return toast.error("Selecciona una casa");
    createUser.mutate({
      name: userForm.name.trim(),
      email: userForm.email.trim() || undefined,
      personalPin: userForm.personalPin,
      profileType: userForm.profileType,
      houseId: userForm.houseId,
      role: userForm.role,
    });
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(filter.toLowerCase())) ||
      (u.houseName && u.houseName.toLowerCase().includes(filter.toLowerCase())),
  );

  const roleOptions = Object.entries(ROLE_LABELS).filter(([k]) => k !== "pet");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Usuarios del sistema ({users.length})
        </h2>
        <div className="flex gap-2 items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, email o casa..."
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm w-full sm:w-64"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Crear
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Casa</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Perfil</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={`${u.id}-${u.houseId}`}
                  className="border-b border-slate-100 dark:border-slate-700/50"
                >
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email ?? "Sin email"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {u.houseName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {editingId === `${u.id}-${u.houseId}` ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                        >
                          {roleOptions.map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            u.houseId &&
                            changeRole.mutate({
                              userId: u.id,
                              houseId: u.houseId,
                              role: newRole,
                            })
                          }
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          u.role === "admin" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          u.role === "responsible" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          u.role === "member" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          u.role === "simplified" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                          u.role === "external" && "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                        )}
                      >
                        {u.role ? ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{u.profileType}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {u.houseId && (
                        <button
                          onClick={() => {
                            setEditingId(`${u.id}-${u.houseId}`);
                            setNewRole(u.role || "member");
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Cambiar rol"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => revokeSession.mutate(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Forzar cierre de sesión"
                      >
                        <LogOutIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al usuario "${u.name}"? Esta acción es irreversible.`))
                            deleteUser.mutate(u.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    {filter ? "Sin resultados" : "Sin usuarios"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Nuevo Usuario</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Nombre *"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <input
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Email (opcional)"
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  value={userForm.personalPin}
                  onChange={(e) => setUserForm({ ...userForm, personalPin: e.target.value })}
                  placeholder="PIN (4-8 dígitos) *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  maxLength={8}
                />
                <input
                  type="password"
                  value={userForm.confirmPin}
                  onChange={(e) => setUserForm({ ...userForm, confirmPin: e.target.value })}
                  placeholder="Confirmar PIN *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  maxLength={8}
                />
              </div>
              <select
                value={userForm.houseId}
                onChange={(e) => setUserForm({ ...userForm, houseId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="">Seleccionar casa *</option>
                {houseOptions.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== "pet").map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={userForm.profileType}
                  onChange={(e) => setUserForm({ ...userForm, profileType: e.target.value as "power" | "focus" })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                >
                  <option value="power">Power</option>
                  <option value="focus">Focus</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createUser.isPending}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {createUser.isPending ? "Creando…" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// LOGS DE ACTIVIDAD
// ══════════════════════════════════════════════

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  userId: string | null;
  userName: string | null;
  houseId: string;
  createdAt: string;
}

interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

function LogsSection() {
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const { data } = useQuery<LogsResponse>({
    queryKey: ["admin-logs", offset],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LogsResponse>>(
        `/admin/logs?limit=${limit}&offset=${offset}`,
      );
      return data.data!;
    },
  });

  const actionLabels: Record<string, string> = {
    role_change: "Cambio de rol",
    force_logout: "Cierre forzado",
    config_update: "Config actualizada",
    login: "Inicio de sesión",
    logout: "Cierre de sesión",
    task_created: "Tarea creada",
    expense_created: "Gasto creado",
    member_added: "Miembro añadido",
    member_removed: "Miembro eliminado",
  };

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Registro de actividad ({total})
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Acción</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Entidad</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Detalles</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                    {actionLabels[l.action] ?? l.action}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-xs">
                    {l.entity}
                    {l.entityId && (
                      <span className="text-slate-400 ml-1 font-mono">
                        {l.entityId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {l.userName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs font-mono max-w-[200px] truncate">
                    {l.details ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("es")}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Sin registros de actividad
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {offset + 1}–{Math.min(offset + limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!hasPrev}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Anterior
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!hasNext}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// CONFIGURACIÓN DEL SISTEMA
// ══════════════════════════════════════════════

interface ConfigEntry {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

function ConfigSection() {
  const qc = useQueryClient();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const { data: config = [] } = useQuery<ConfigEntry[]>({
    queryKey: ["admin-config"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConfigEntry[]>>("/admin/config");
      return data.data!;
    },
  });

  const update = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await api.put(`/admin/config/${key}`, { value });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-config"] });
      toast.success("Configuración guardada");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const configLabels: Record<string, string> = {
    allow_house_creation: "Creación de casas",
    allow_self_registration: "Auto-registro",
    max_houses_per_responsible: "Máx. casas por responsable",
    session_timeout_minutes: "Timeout de sesión (min)",
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-900 dark:text-white">Configuración del sistema</h2>

      <div className="space-y-3">
        {config.map((c) => {
          const currentValue = editValues[c.key] ?? c.value;
          const isDirty = editValues[c.key] !== undefined && editValues[c.key] !== c.value;

          return (
            <div
              key={c.key}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                    {configLabels[c.key] ?? c.key}
                  </p>
                  {c.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {c.value === "true" || c.value === "false" ? (
                    <button
                      onClick={() => {
                        const next = currentValue === "true" ? "false" : "true";
                        setEditValues({ ...editValues, [c.key]: next });
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        currentValue === "true"
                          ? "bg-blue-500"
                          : "bg-slate-300 dark:bg-slate-600",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          currentValue === "true" ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>
                  ) : (
                    <input
                      value={currentValue}
                      onChange={(e) =>
                        setEditValues({ ...editValues, [c.key]: e.target.value })
                      }
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm w-48"
                    />
                  )}
                  {isDirty && (
                    <button
                      onClick={() => update.mutate({ key: c.key, value: currentValue })}
                      className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      title="Guardar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {config.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin configuración</p>
        )}
      </div>
    </div>
  );
}
