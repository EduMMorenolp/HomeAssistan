// ══════════════════════════════════════════════
// Pantalla: Solicitud Pendiente de Aprobación
// ══════════════════════════════════════════════

import { useNavigate, useLocation } from "react-router-dom";
import { Clock, ArrowLeft } from "lucide-react";

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const houseName: string | undefined = location.state?.houseName;
  const userName: string | undefined = location.state?.userName;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 text-center">
      {/* Icono */}
      <div className="flex justify-center mb-6 mt-2">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/20 flex items-center justify-center">
          <Clock className="w-10 h-10 text-amber-400" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        Solicitud Pendiente
      </h2>

      <p className="text-slate-300 text-sm mb-2">
        {userName ? `${userName}, tu` : "Tu"} solicitud de acceso a{" "}
        <span className="text-white font-medium">{houseName || "la casa"}</span>{" "}
        ha sido enviada correctamente.
      </p>

      <p className="text-slate-400 text-sm mb-8">
        Un administrador o responsable deberá aprobar tu solicitud. Una vez
        aprobada, podrás iniciar sesión con tu PIN personal.
      </p>

      {/* Indicador animado */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-400 text-sm font-medium">
          Esperando aprobación...
        </span>
      </div>

      <button
        onClick={() => navigate("/auth/house", { replace: true })}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </button>
    </div>
  );
}
