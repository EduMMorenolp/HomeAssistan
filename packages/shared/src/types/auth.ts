// ══════════════════════════════════════════════
// Tipos de Autenticación
// ══════════════════════════════════════════════

import type { Role } from "./roles";

/** Paso 1: Seleccionar casa con PIN */
export interface HouseSelectRequest {
  houseId: string;
  pin: string;
}

export interface HouseSelectResponse {
  houseToken: string;
  houseName: string;
  members: { id: string; name: string; avatar?: string }[];
}

/** Paso 2: Login de usuario con PIN personal */
export interface UserLoginRequest {
  userId: string;
  personalPin: string;
  houseToken: string;
}

export interface UserLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: Role;
    profileType: "power" | "focus";
  };
}

/** Refresh token */
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/** JWT Payload */
export interface JwtPayload {
  userId: string;
  houseId: string;
  role: Role;
  iat?: number;
  exp?: number;
}
