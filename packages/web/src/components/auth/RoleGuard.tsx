// ══════════════════════════════════════════════
// <RoleGuard> — Protección de rutas por rol
// ══════════════════════════════════════════════

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { Role } from "@homeassistan/shared";
import { ROLE_HIERARCHY } from "@homeassistan/shared";

interface RoleGuardProps {
  /** Rol mínimo requerido (usa jerarquía) */
  minRole?: Role;
  /** O lista explícita de roles permitidos */
  allowedRoles?: Role[];
  /** Ruta a redirigir si no tiene permiso */
  redirectTo?: string;
  /** Contenido protegido */
  children: ReactNode;
}

export function RoleGuard({
  minRole,
  allowedRoles,
  redirectTo = "/dashboard",
  children,
}: RoleGuardProps) {
  const { role } = usePermissions();

  let hasAccess = false;

  if (allowedRoles) {
    hasAccess = allowedRoles.includes(role);
  } else if (minRole) {
    hasAccess = ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
