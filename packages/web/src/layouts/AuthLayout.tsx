// ══════════════════════════════════════════════
// Auth Layout (pantallas de login)
// ══════════════════════════════════════════════

import { Outlet } from "react-router-dom";
import { Home } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-6 sm:p-4">
      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-500 text-white mb-3 sm:mb-4">
          <Home className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">HomeAsisstan</h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">Gestión Integral del Hogar</p>
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
