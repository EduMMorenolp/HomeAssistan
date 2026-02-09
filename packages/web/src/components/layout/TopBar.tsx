// ══════════════════════════════════════════════
// Top Bar - Responsive
// ══════════════════════════════════════════════

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Bell, Menu, Search, User, X } from "lucide-react";

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="relative h-14 sm:h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 sm:px-4 md:px-6 gap-2 shrink-0">
      {/* Left side: hamburger + search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Search - desktop: siempre visible */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-full max-w-xs lg:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
          />
        </div>

        {/* Search toggle - mobile only */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="sm:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Buscar"
        >
          {searchOpen ? (
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          ) : (
            <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          )}
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-30">
              {user?.name || "Usuario"}
            </p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Search expanded - mobile fullwidth below header */}
      {searchOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 sm:hidden z-40">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              autoFocus
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
            />
          </div>
        </div>
      )}
    </header>
  );
}
