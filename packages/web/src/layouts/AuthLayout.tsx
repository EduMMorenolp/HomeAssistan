// ══════════════════════════════════════════════
// Auth Layout (pantallas de login)
// ══════════════════════════════════════════════

import { Outlet } from "react-router-dom";
import { Home } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 text-white mb-4">
          <Home className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white">HomeAsisstan</h1>
        <p className="text-slate-400 mt-1">Gestión Integral del Hogar</p>
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
