// ══════════════════════════════════════════════
// Auth Store (Zustand)
// ══════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@homeassistan/shared";

interface AuthUser {
  id: string;
  name: string;
  role: Role;
  profileType: "power" | "focus";
}

interface HouseInfo {
  id: string;
  name: string;
}

interface AuthState {
  // State
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  house: HouseInfo | null;
  houseToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setHouse: (house: HouseInfo, houseToken: string) => void;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      accessToken: null,
      refreshToken: null,
      user: null,
      house: null,
      houseToken: null,
      isAuthenticated: false,

      // Paso 1: Seleccionar casa
      setHouse: (house, houseToken) => set({ house, houseToken }),

      // Paso 2: Login completo
      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      // Refresh tokens
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      // Logout
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          house: null,
          houseToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "homeassistan-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        house: state.house,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
