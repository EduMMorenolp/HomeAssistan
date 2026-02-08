// ══════════════════════════════════════════════
// Tipos de Usuario
// ══════════════════════════════════════════════

import type { Role } from "./roles";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  profileType: "power" | "focus";
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseMember {
  userId: string;
  houseId: string;
  role: Role;
  joinedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email?: string;
  personalPin: string;
  profileType?: "power" | "focus";
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
  profileType?: "power" | "focus";
}
