// ══════════════════════════════════════════════
// Pantalla: Activar Cuenta (PIN temporal → personal)
// ══════════════════════════════════════════════

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

export function ActivateAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const activationToken: string | undefined = location.state?.activationToken;
  const userName: string | undefined = location.state?.userName;

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const activateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/activate", {
        activationToken,
        newPin,
      });
      return data.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      toast.success("¡Cuenta activada! Bienvenido.");
      navigate("/dashboard", { replace: true });
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.error?.message || "Error al activar la cuenta";
      toast.error(msg);
    },
  });

  if (!activationToken) {
    navigate("/auth/house", { replace: true });
    return null;
  }

  const pinsMatch = newPin === confirmPin;
  const canSubmit = newPin.length >= 4 && pinsMatch && !activateMutation.isPending;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => navigate("/auth/house")}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Activar Cuenta</h2>
          <p className="text-slate-400 text-sm">
            {userName ? `Hola ${userName}, crea` : "Crea"} tu PIN personal
          </p>
        </div>
      </div>

      {/* Icono informativo */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      <p className="text-slate-300 text-sm text-center mb-6">
        Has iniciado sesión con un PIN temporal. Establece tu PIN personal para
        completar la activación.
      </p>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">
            Nuevo PIN personal
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              maxLength={8}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Mínimo 4 dígitos"
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">
            Confirmar PIN
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              maxLength={8}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Repite tu PIN"
              className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white text-center text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none ${
                confirmPin && !pinsMatch
                  ? "border-red-500 focus:border-red-500"
                  : "border-white/10 focus:border-blue-500"
              }`}
              onKeyDown={(e) =>
                e.key === "Enter" && canSubmit && activateMutation.mutate()
              }
            />
          </div>
          {confirmPin && !pinsMatch && (
            <p className="text-red-400 text-xs mt-1">Los PINs no coinciden</p>
          )}
        </div>

        <button
          onClick={() => activateMutation.mutate()}
          disabled={!canSubmit}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          {activateMutation.isPending ? "Activando..." : "Activar Cuenta"}
        </button>
      </div>
    </div>
  );
}
