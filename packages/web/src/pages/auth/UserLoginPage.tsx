// ══════════════════════════════════════════════
// Pantalla 2: Login de Usuario
// ══════════════════════════════════════════════

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

interface MemberInfo {
  id: string;
  name: string;
  avatar?: string;
}

export function UserLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { houseToken, house, login } = useAuthStore();

  const members: MemberInfo[] = location.state?.members || [];
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/user/login", {
        userId: selectedUserId,
        personalPin: pin,
        houseToken,
      });
      return data.data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Bienvenido, ${data.user.name}`);
      navigate("/dashboard", { replace: true });
    },
    onError: () => {
      toast.error("PIN incorrecto");
      setPin("");
    },
  });

  // Si no hay houseToken, volver a selección de casa
  if (!houseToken) {
    navigate("/auth/house", { replace: true });
    return null;
  }

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
          <h2 className="text-xl font-bold text-white">¿Quién eres?</h2>
          <p className="text-slate-400 text-sm">{house?.name}</p>
        </div>
      </div>

      {/* Lista de miembros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => {
              setSelectedUserId(member.id);
              setPin("");
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border transition-all",
              selectedUserId === member.id
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 hover:border-white/20 bg-white/5",
            )}
          >
            <div
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold",
                selectedUserId === member.id
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-slate-400",
              )}
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                member.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-sm text-white font-medium">{member.name}</span>
          </button>
        ))}
      </div>

      {/* PIN Input */}
      {selectedUserId && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Tu PIN personal</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => e.key === "Enter" && pin.length >= 4 && loginMutation.mutate()}
              />
            </div>
          </div>

          <button
            onClick={() => loginMutation.mutate()}
            disabled={pin.length < 4 || loginMutation.isPending}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </button>
        </div>
      )}
    </div>
  );
}
