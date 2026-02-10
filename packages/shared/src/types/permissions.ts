// ══════════════════════════════════════════════
// Permissions Matrix (RBAC)
// ══════════════════════════════════════════════

import type { Role } from "./roles";
import { ROLE_HIERARCHY } from "./roles";

// ── Access Level Types ───────────────────────

export type AccessLevel = "full" | "read" | "own" | "none";

// ── Permission Definitions ───────────────────

export const PERMISSIONS = {
  // ── 1. Gestión del Sistema y Usuarios ──────
  system: {
    accessAdminPanel: ["admin"],
    viewServerLogs: ["admin"],
    createHouse: ["admin", "responsible"],
    editHouseConfig: ["admin", "responsible"],
    viewHouseConfig: ["admin", "responsible", "member"],
    createUserResponsible: ["admin"],
    createUserOther: ["admin", "responsible"],
    createPetProfile: ["admin", "responsible", "member"],
    deleteUsers: ["admin"],
    changeOwnPin: ["admin", "responsible", "member", "simplified", "external"],
  },

  // ── 2. Finanzas ────────────────────────────
  finance: {
    viewGlobalBalance: ["admin", "responsible"],
    viewOwnExpenses: ["admin", "responsible", "member", "simplified"],
    addExpense: ["admin", "responsible", "member"],
    editExpense: ["admin", "responsible"],
    deleteExpense: ["admin", "responsible"],
    manageShopping: ["admin", "responsible", "member"],
    manageInventory: ["admin", "responsible", "member"],
  },

  // ── 3. Tareas ──────────────────────────────
  tasks: {
    createAndAssign: ["admin", "responsible"],
    createOwn: ["admin", "responsible", "member", "simplified"],
    markComplete: ["admin", "responsible", "member", "simplified", "external"],
    deleteTasks: ["admin", "responsible"],
    configureRotation: ["admin", "responsible"],
    viewTasks: ["admin", "responsible", "member", "simplified", "external"],
  },

  // ── 4. Calendario ──────────────────────────
  calendar: {
    createEvent: ["admin", "responsible", "member"],
    editEvent: ["admin", "responsible", "member"],
    deleteEvent: ["admin", "responsible"],
    viewEvents: ["admin", "responsible", "member", "simplified", "external"],
  },

  // ── 5. Comunicación ────────────────────────
  communication: {
    sendMessages: ["admin", "responsible", "member", "simplified"],
    readFullHistory: ["admin", "responsible", "member"],
    readLimitedHistory: ["admin", "responsible", "member", "simplified"],
    manageAnnouncements: ["admin", "responsible"],
    viewAnnouncements: ["admin", "responsible", "member", "simplified"],
    triggerPanic: ["admin", "responsible", "member", "simplified", "external"],
  },

  // ── 6. Seguridad ──────────────────────────
  security: {
    manageVault: ["admin", "responsible"],
    manageContacts: ["admin", "responsible"],
    viewContacts: ["admin", "responsible", "member"],
    manageVisitorCodes: ["admin", "responsible"],
    viewVisitorCodes: ["admin", "responsible", "member"],
    triggerSOS: ["admin", "responsible", "member", "simplified", "external"],
    viewAccessLogs: ["admin"],
  },

  // ── 7. Salud ───────────────────────────────
  health: {
    viewProfiles: ["admin", "responsible", "member"],
    editOwnProfile: ["admin", "responsible", "member"],
    editAnyProfile: ["admin", "responsible"],
    manageMedications: ["admin", "responsible"],
    viewMedications: ["admin", "responsible", "member", "simplified", "external"],
    logMedication: ["admin", "responsible", "member", "simplified"],
    manageRoutines: ["admin", "responsible", "member"],
    viewRoutines: ["admin", "responsible", "member", "simplified"],
  },

  // ── 8. Dashboard ───────────────────────────
  dashboard: {
    viewFullStats: ["admin", "responsible"],
    viewBasicStats: ["admin", "responsible", "member", "simplified"],
    managePreferences: ["admin", "responsible", "member", "simplified", "external"],
    viewActivity: ["admin", "responsible"],
  },

  // ── 9. Mascotas ────────────────────────────
  pets: {
    viewPets: ["admin", "responsible", "member"],
    createPet: ["admin", "responsible", "member"],
    editPet: ["admin", "responsible", "member"],
    deletePet: ["admin", "responsible"],
  },
} as const;

// ── Type Utilities ───────────────────────────

export type PermissionModule = keyof typeof PERMISSIONS;
export type PermissionAction<M extends PermissionModule> = keyof (typeof PERMISSIONS)[M];

// ── Helper Functions ─────────────────────────

/** Check if a role has permission for a specific module action */
export function hasPermission<M extends PermissionModule>(
  role: Role | undefined,
  module: M,
  action: PermissionAction<M>,
): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[module][action] as readonly string[];
  return allowedRoles.includes(role);
}

/** Check if role meets minimum hierarchy level */
export function hasMinRole(role: Role | undefined, minRole: Role): boolean {
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

/** Get all allowed modules for a role */
export function getAllowedModules(role: Role): PermissionModule[] {
  const modules: PermissionModule[] = [];
  for (const [module, actions] of Object.entries(PERMISSIONS)) {
    const hasAny = Object.values(actions).some((roles) =>
      (roles as readonly string[]).includes(role),
    );
    if (hasAny) modules.push(module as PermissionModule);
  }
  return modules;
}

/** Get all permissions for a role in a specific module */
export function getModulePermissions<M extends PermissionModule>(
  role: Role,
  module: M,
): PermissionAction<M>[] {
  const result: PermissionAction<M>[] = [];
  const modulePerms = PERMISSIONS[module];
  for (const [action, roles] of Object.entries(modulePerms)) {
    if ((roles as readonly string[]).includes(role)) {
      result.push(action as PermissionAction<M>);
    }
  }
  return result;
}
