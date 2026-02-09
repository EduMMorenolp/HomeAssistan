// ══════════════════════════════════════════════
// Security Page (Contactos, Bóveda, Códigos, Logs)
// ══════════════════════════════════════════════

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  ApiResponse,
  EmergencyContactInfo,
  VaultEntryInfo,
  VisitorCodeInfo,
  AccessLogInfo,
} from "@homeassistan/shared";
import { VAULT_CATEGORY_LABELS } from "@homeassistan/shared";
import {
  Shield,
  Phone,
  Lock,
  Key,
  FileText,
  Plus,
  X,
  Trash2,
  Copy,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

type Tab = "contacts" | "vault" | "codes" | "logs";

export function SecurityPage() {
  const [tab, setTab] = useState<Tab>("contacts");
  const { can } = usePermissions();

  const allTabs: { key: Tab; label: string; icon: typeof Shield; visible: boolean }[] = [
    { key: "contacts", label: "Contactos", icon: Phone, visible: can("security", "viewContacts") },
    { key: "vault", label: "Bóveda", icon: Lock, visible: can("security", "manageVault") },
    { key: "codes", label: "Códigos", icon: Key, visible: can("security", "viewVisitorCodes") },
    { key: "logs", label: "Accesos", icon: FileText, visible: can("security", "viewAccessLogs") },
  ];

  const tabs = allTabs.filter((t) => t.visible);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Seguridad</h1>

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

      {tab === "contacts" && <ContactsSection />}
      {tab === "vault" && <VaultSection />}
      {tab === "codes" && <CodesSection />}
      {tab === "logs" && <LogsSection />}
    </div>
  );
}

// ══════════════════════════════════════════════
// CONTACTOS DE EMERGENCIA
// ══════════════════════════════════════════════

function ContactsSection() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: contacts = [] } = useQuery<EmergencyContactInfo[]>({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EmergencyContactInfo[]>>("/security/contacts");
      return data.data!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/security/contacts", {
        name,
        phone,
        relationship: relationship || undefined,
        isPrimary,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
      toast.success("Contacto añadido");
      setShowCreate(false);
      setName("");
      setPhone("");
      setRelationship("");
      setIsPrimary(false);
    },
    onError: () => toast.error("Error al añadir"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/security/contacts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
      toast.success("Contacto eliminado");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Contactos de emergencia</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Añadir"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Relación (ej: Médico, Vecino)"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded"
              />
              Principal
            </label>
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim() || !phone.trim()}
            className="w-full py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
          >
            Añadir contacto
          </button>
        </div>
      )}

      <div className="space-y-2">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                c.isPrimary
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-slate-100 dark:bg-slate-700",
              )}
            >
              {c.isPrimary ? (
                <Star className="w-5 h-5 text-yellow-500" />
              ) : (
                <Phone className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-900 dark:text-white">{c.name}</p>
              <p className="text-xs text-slate-500">
                {c.phone}
                {c.relationship && ` · ${c.relationship}`}
              </p>
            </div>
            <a
              href={`tel:${c.phone}`}
              className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={() => del.mutate(c.id)}
              className="p-2 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin contactos de emergencia</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// BÓVEDA SEGURA
// ══════════════════════════════════════════════

function VaultSection() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState<string>("wifi");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const { data: entries = [] } = useQuery<VaultEntryInfo[]>({
    queryKey: ["vault"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VaultEntryInfo[]>>("/security/vault");
      return data.data!;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.post("/security/vault", {
        category,
        label,
        value,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault"] });
      toast.success("Entrada guardada");
      setShowCreate(false);
      setLabel("");
      setValue("");
      setNotes("");
    },
    onError: () => toast.error("Error al guardar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/security/vault/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault"] });
      toast.success("Entrada eliminada");
    },
  });

  function toggleVisible(id: string) {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Bóveda segura</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Añadir"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              {Object.entries(VAULT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Etiqueta"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valor (contraseña, PIN, etc.)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <button
            onClick={() => create.mutate()}
            disabled={!label.trim() || !value.trim()}
            className="w-full py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-slate-900 dark:text-white">{e.label}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                    {VAULT_CATEGORY_LABELS[e.category]}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                  {visibleIds.has(e.id) ? e.value : "••••••••"}
                </p>
                {e.notes && <p className="text-xs text-slate-400 mt-0.5">{e.notes}</p>}
              </div>
              <button
                onClick={() => toggleVisible(e.id)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                {visibleIds.has(e.id) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(e.value);
                  toast.success("Copiado");
                }}
                className="p-2 text-slate-400 hover:text-blue-500"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => del.mutate(e.id)}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Bóveda vacía</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// CÓDIGOS DE VISITANTE
// ══════════════════════════════════════════════

function CodesSection() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: codes = [] } = useQuery<VisitorCodeInfo[]>({
    queryKey: ["visitor-codes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VisitorCodeInfo[]>>("/security/visitor-codes");
      return data.data!;
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      await api.post("/security/visitor-codes", {
        label: label || undefined,
        expiresAt: expiresAt || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-codes"] });
      toast.success("Código generado");
      setShowCreate(false);
      setLabel("");
      setExpiresAt("");
    },
    onError: () => toast.error("Error al generar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/security/visitor-codes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitor-codes"] });
      toast.success("Código eliminado");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-900 dark:text-white">Códigos de visitante</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancelar" : "Generar"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Etiqueta (ej: Fontanero martes)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Expira (opcional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <button
            onClick={() => generate.mutate()}
            className="w-full py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            Generar código
          </button>
        </div>
      )}

      <div className="space-y-2">
        {codes.map((c) => {
          const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
          return (
            <div
              key={c.id}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl p-4 border flex items-center gap-3",
                c.isUsed || expired
                  ? "border-slate-200 dark:border-slate-700 opacity-60"
                  : "border-green-200 dark:border-green-800",
              )}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Key className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="font-mono text-lg font-bold text-slate-900 dark:text-white tracking-wider">
                  {c.code}
                </p>
                <p className="text-xs text-slate-500">
                  {c.label ?? "Sin etiqueta"}
                  {c.isUsed && " · Usado"}
                  {expired && " · Expirado"}
                  {c.expiresAt &&
                    !expired &&
                    ` · Expira: ${new Date(c.expiresAt).toLocaleString("es")}`}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  toast.success("Código copiado");
                }}
                className="p-2 text-slate-400 hover:text-blue-500"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => del.mutate(c.id)}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {codes.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">Sin códigos generados</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// LOGS DE ACCESO
// ══════════════════════════════════════════════

function LogsSection() {
  const { data: logs = [] } = useQuery<AccessLogInfo[]>({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AccessLogInfo[]>>("/security/access-logs");
      return data.data!;
    },
  });

  const actionLabels: Record<string, string> = {
    login: "Inicio de sesión",
    logout: "Cierre de sesión",
    failed_login: "Login fallido",
    house_select: "Selección de casa",
    visitor_code_used: "Código de visitante usado",
    panic_triggered: "Pánico activado",
    vault_accessed: "Bóveda accedida",
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-900 dark:text-white">Registro de accesos</h2>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Acción</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">IP</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                    {actionLabels[l.action] ?? l.action}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {l.userName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">
                    {l.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">
                    {new Date(l.createdAt).toLocaleString("es")}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
