// ══════════════════════════════════════════════
// <Can> — Renderizado condicional por permisos
// ══════════════════════════════════════════════

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionModule, PermissionAction } from "@homeassistan/shared";

interface CanProps<M extends PermissionModule> {
  /** Módulo del permiso (finance, tasks, etc.) */
  module: M;
  /** Acción a verificar (viewOwnExpenses, createOwn, etc.) */
  action: PermissionAction<M>;
  /** Contenido a renderizar si tiene permiso */
  children: ReactNode;
  /** Contenido alternativo si no tiene permiso */
  fallback?: ReactNode;
}

export function Can<M extends PermissionModule>({
  module,
  action,
  children,
  fallback = null,
}: CanProps<M>) {
  const { can } = usePermissions();
  return can(module, action) ? <>{children}</> : <>{fallback}</>;
}
