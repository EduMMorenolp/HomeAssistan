// ══════════════════════════════════════════════
// Settings Page — Configuración personal
// ══════════════════════════════════════════════

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import type { ApiResponse } from "@homeassistan/shared";
import { ROLE_LABELS } from "@homeassistan/shared";
import {
  Settings,
  User,
  Key,
  Users,
  ChevronRight,
  Save,
} from "lucide-react";

export function SettingsPage() {
  const { user } = useAuthStore();
  const { role, isAdmin, isResponsible } = usePermissions();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-slate-400" />
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Configuración
        </h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Edit */}
      <ProfileSection />

      {/* Change PIN */}
      <ChangePinSection />

      {/* House members (admin/responsible only) */}
      {(isAdmin || isResponsible) && (
        <button
          onClick={() => navigate("/settings/members")}
          className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-slate-900 dark:text-white">
              Gestionar Miembros
            </p>
            <p className="text-xs text-slate-500">Invitar, cambiar roles, eliminar miembros</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      )}
    </div>
  );
}

// ── Profile Edit Section ─────────────────────

function ProfileSection() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const update = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const userId = useAuthStore.getState().user?.id;
      await api.patch(`/users/${userId}`, { name: name.trim() });
    },
    onSuccess: () => {
      toast.success("Perfil actualizado");
      setSaving(false);
    },
    onError: () => {
      toast.error("Error al actualizar");
      setSaving(false);
    },
  });

  const isDirty = name.trim() !== (user?.name ?? "");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Perfil</h3>
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
        />
      </div>
      {isDirty && (
        <button
          onClick={() => update.mutate()}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Guardar cambios
        </button>
      )}
    </div>
  );
}

// ── Change PIN Section ───────────────────────

function ChangePinSection() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const changePin = useMutation({
    mutationFn: async () => {
      const userId = useAuthStore.getState().user?.id;
      await api.patch<ApiResponse>(`/users/${userId}/pin`, {
        currentPin,
        newPin,
      });
    },
    onSuccess: () => {
      toast.success("PIN actualizado");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    },
    onError: () => toast.error("Error: verifica tu PIN actual"),
  });

  const canSubmit =
    currentPin.length >= 4 &&
    newPin.length >= 4 &&
    newPin === confirmPin;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Cambiar PIN</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">PIN actual</label>
          <input
            type="password"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            maxLength={8}
            placeholder="····"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Nuevo PIN</label>
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
            <label className="text-xs text-slate-500 mb-1 block">Confirmar PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              maxLength={8}
              placeholder="····"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
        </div>
        {newPin && confirmPin && newPin !== confirmPin && (
          <p className="text-xs text-red-500">Los PINs no coinciden</p>
        )}
      </div>
      <button
        onClick={() => changePin.mutate()}
        disabled={!canSubmit}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
      >
        <Key className="w-4 h-4" />
        Cambiar PIN
      </button>
    </div>
  );
}
