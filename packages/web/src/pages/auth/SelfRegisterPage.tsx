// ══════════════════════════════════════════════
// Pantalla: Auto-registro (solicitar acceso a casa)
// ══════════════════════════════════════════════

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, KeyRound, User } from "lucide-react";
import { api } from "@/lib/api";

export function SelfRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const houseId: string | undefined = location.state?.houseId;
  const houseName: string | undefined = location.state?.houseName;

  const [name, setName] = useState("");
  const [personalPin, setPersonalPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/register", {
        name,
        personalPin,
        houseId,
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success("Solicitud enviada correctamente");
      navigate("/auth/pending", {
        state: { houseName, userName: name },
        replace: true,
      });
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.error?.message || "Error al registrarse";
      toast.error(msg);
    },
  });

  if (!houseId) {
    navigate("/auth/house", { replace: true });
    return null;
  }

  const pinsMatch = personalPin === confirmPin;
  const canSubmit =
    name.trim().length >= 2 &&
    personalPin.length >= 4 &&
    pinsMatch &&
    !registerMutation.isPending;

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
          <h2 className="text-xl font-bold text-white">Solicitar Acceso</h2>
          <p className="text-slate-400 text-sm">{houseName || "Casa"}</p>
        </div>
      </div>

      {/* Icono */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-blue-400" />
        </div>
      </div>

      <p className="text-slate-300 text-sm text-center mb-6">
        Completa tus datos para solicitar acceso. Un administrador o responsable
        deberá aprobar tu solicitud.
      </p>

      {/* Form */}
      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">
            Tu nombre
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* PIN */}
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">
            PIN personal
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              maxLength={8}
              value={personalPin}
              onChange={(e) => setPersonalPin(e.target.value)}
              placeholder="Mínimo 4 dígitos"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Confirmar PIN */}
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
                e.key === "Enter" && canSubmit && registerMutation.mutate()
              }
            />
          </div>
          {confirmPin && !pinsMatch && (
            <p className="text-red-400 text-xs mt-1">Los PINs no coinciden</p>
          )}
        </div>

        <button
          onClick={() => registerMutation.mutate()}
          disabled={!canSubmit}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          {registerMutation.isPending ? "Enviando..." : "Solicitar Acceso"}
        </button>
      </div>
    </div>
  );
}
