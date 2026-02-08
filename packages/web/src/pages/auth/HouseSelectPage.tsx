// ══════════════════════════════════════════════
// Pantalla 1: Selección de Casa
// ══════════════════════════════════════════════

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home, Lock, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

export function HouseSelectPage() {
  const navigate = useNavigate();
  const { setHouse } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  // Obtener lista de casas
  const { data: houses, isLoading } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data } = await api.get("/houses");
      return data.data as { id: string; name: string; address?: string }[];
    },
  });

  // Seleccionar casa con PIN
  const selectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/house/select", {
        houseId: selectedId,
        pin,
      });
      return data.data;
    },
    onSuccess: (data) => {
      setHouse({ id: selectedId!, name: data.houseName }, data.houseToken);
      navigate("/auth/login", { state: { members: data.members } });
    },
    onError: () => {
      toast.error("PIN incorrecto");
      setPin("");
    },
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Selecciona tu Casa</h2>
      <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">
        Elige una casa e ingresa el PIN compartido
      </p>

      {/* Lista de casas */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-400">Cargando...</div>
      ) : houses?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">No hay casas registradas</p>
          <button
            onClick={() => navigate("/auth/house/create")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Crear primera Casa
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {houses?.map((house) => (
            <button
              key={house.id}
              onClick={() => setSelectedId(house.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                selectedId === house.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 hover:border-white/20 bg-white/5",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  selectedId === house.id ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400",
                )}
              >
                <Home className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{house.name}</p>
                {house.address && <p className="text-slate-500 text-xs">{house.address}</p>}
              </div>
              {selectedId === house.id && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </button>
          ))}
        </div>
      )}

      {/* PIN Input */}
      {selectedId && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">PIN de la Casa</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => e.key === "Enter" && pin.length >= 4 && selectMutation.mutate()}
              />
            </div>
          </div>

          <button
            onClick={() => selectMutation.mutate()}
            disabled={pin.length < 4 || selectMutation.isPending}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {selectMutation.isPending ? "Verificando..." : "Continuar"}
          </button>
        </div>
      )}
    </div>
  );
}
