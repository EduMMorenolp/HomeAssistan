// ══════════════════════════════════════════════
// Roles del Sistema
// ══════════════════════════════════════════════

export const ROLES = {
  ADMIN: "admin",
  RESPONSIBLE: "responsible",
  MEMBER: "member",
  SIMPLIFIED: "simplified",
  EXTERNAL: "external",
  PET: "pet",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  responsible: "Responsable",
  member: "Miembro",
  simplified: "Simplificado",
  external: "Externo",
  pet: "Mascota",
};

/** Jerarquía de permisos (mayor número = más permisos) */
export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 100,
  responsible: 80,
  member: 50,
  simplified: 20,
  external: 10,
  pet: 0,
};
