// ══════════════════════════════════════════════
// Create House Page — Crear primera casa
// ══════════════════════════════════════════════

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ApiResponse } from "@homeassistan/shared";
import { Home, ArrowLeft } from "lucide-react";

export function CreateHousePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    pin: "",
    confirmPin: "",
  });

  const createHouse = useMutation({
    mutationFn: async (body: { name: string; address?: string; pin: string }) => {
      const { data } = await api.post<ApiResponse<{ id: string; name: string }>>("/houses", body);
      return data.data!;
    },
    onSuccess: (house) => {
      toast.success(`Casa "${house.name}" creada correctamente`);
      navigate("/auth/house", { replace: true });
    },
    onError: () => toast.error("Error al crear la casa"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    if (form.pin.length < 4) return toast.error("El PIN debe tener al menos 4 dígitos");
    if (form.pin !== form.confirmPin) return toast.error("Los PINs no coinciden");

    createHouse.mutate({
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      pin: form.pin,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <Home className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crear nueva casa</h1>
        <p className="text-sm text-slate-500">
          Configura tu hogar para empezar a gestionar todo en familia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre de la casa *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Casa García"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Dirección (opcional)
          </label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ej: Calle Principal 42"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            PIN de acceso a la casa * <span className="text-slate-400 font-normal">(4-8 dígitos)</span>
          </label>
          <input
            type="password"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            placeholder="••••"
            maxLength={8}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Confirmar PIN *
          </label>
          <input
            type="password"
            value={form.confirmPin}
            onChange={(e) => setForm({ ...form, confirmPin: e.target.value })}
            placeholder="••••"
            maxLength={8}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={createHouse.isPending}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {createHouse.isPending ? "Creando…" : "Crear Casa"}
        </button>
      </form>

      <button
        onClick={() => navigate("/auth/house")}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mx-auto"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a selección de casa
      </button>
    </div>
  );
}
