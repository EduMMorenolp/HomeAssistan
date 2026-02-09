// ══════════════════════════════════════════════
// usePermissions Hook — RBAC para el frontend
// ══════════════════════════════════════════════

import { useMemo } from "react";
import {
  hasPermission,
  getAllowedModules,
  type PermissionModule,
  type PermissionAction,
  type Role,
} from "@homeassistan/shared";
import { useAuthStore } from "@/stores/auth.store";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? ("member" as Role);

  return useMemo(
    () => ({
      /** Check if user can perform action on module */
      can: <M extends PermissionModule>(module: M, action: PermissionAction<M>): boolean =>
        hasPermission(role, module, action),

      /** Current role */
      role,

      /** Role shortcuts */
      isAdmin: role === "admin",
      isResponsible: role === "responsible",
      isMember: role === "member",
      isSimplified: role === "simplified",
      isExternal: role === "external",
      isPet: role === "pet",

      /** Profile type */
      isFocusMode: user?.profileType === "focus",

      /** Modules this role can access */
      allowedModules: getAllowedModules(role),

      /** Can access at least one action in a module */
      canAccessModule: (module: PermissionModule): boolean =>
        getAllowedModules(role).includes(module),
    }),
    [role, user?.profileType],
  );
}
