// ══════════════════════════════════════════════
// Auth Middleware - JWT Verification + RBAC
// ══════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload, Role } from "@homeassistan/shared";
import {
  ROLE_HIERARCHY,
  hasPermission,
  type PermissionModule,
  type PermissionAction,
} from "@homeassistan/shared";
import { AppError } from "./error-handler";

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ══════════════════════════════════════════════
// AUTHENTICATION
// ══════════════════════════════════════════════

/** Verifica que el request tenga un token JWT válido */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "UNAUTHORIZED", "Token no proporcionado");
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "INVALID_TOKEN", "Token inválido o expirado"));
  }
}

// ══════════════════════════════════════════════
// AUTHORIZATION (Role-based)
// ══════════════════════════════════════════════

/** Verifica que el usuario tenga uno de los roles permitidos (lista explícita) */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "No autenticado"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "No tienes permisos para esta acción"));
    }
    next();
  };
}

/** Verifica que el usuario tenga al menos el rol mínimo (usa jerarquía numérica) */
export function authorizeMin(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "No autenticado"));
    }
    if (ROLE_HIERARCHY[req.user.role] < ROLE_HIERARCHY[minRole]) {
      return next(new AppError(403, "FORBIDDEN", "No tienes permisos para esta acción"));
    }
    next();
  };
}

/** Verifica permisos granulares por módulo + acción (basado en PERMISSIONS matrix) */
export function requirePermission<M extends PermissionModule>(
  module: M,
  action: PermissionAction<M>,
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "No autenticado"));
    }
    if (!hasPermission(req.user.role, module, action)) {
      return next(
        new AppError(403, "FORBIDDEN", `Sin permiso: ${String(module)}.${String(action)}`),
      );
    }
    next();
  };
}

// ══════════════════════════════════════════════
// OWNERSHIP CHECKS
// ══════════════════════════════════════════════

/**
 * Verifica que el usuario sea el dueño del recurso O tenga un rol mínimo.
 * El ownership se compara: req.user.userId === req.params[paramKey]
 */
export function ownerOrRole(minRole: Role, paramKey = "id") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "No autenticado"));
    }

    const targetId = req.params[paramKey];

    // Es el propio usuario → permitir
    if (req.user.userId === targetId) {
      return next();
    }

    // Tiene rol suficiente → permitir
    if (ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY[minRole]) {
      return next();
    }

    return next(new AppError(403, "FORBIDDEN", "No tienes permisos para este recurso"));
  };
}

/**
 * Verifica que el usuario sea el dueño del recurso O sea admin.
 * Shortcut para ownerOrRole('admin')
 */
export function ownerOrAdmin(paramKey = "id") {
  return ownerOrRole("admin", paramKey);
}

// ══════════════════════════════════════════════
// HOUSE GUARD (Tenancy Isolation)
// ══════════════════════════════════════════════

/**
 * Verifica que el usuario pertenece a la casa referenciada en la request.
 * Compara req.user.houseId con:
 *   1. req.params[paramKey] (si existe)
 *   2. req.body.houseId (si existe)
 * Si no hay referencia explícita, inyecta houseId del JWT.
 *
 * Admins pueden acceder a cualquier casa.
 */
export function belongsToHouse(paramKey = "houseId") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "No autenticado"));
    }

    // Admin global puede acceder a cualquier casa
    if (req.user.role === "admin") {
      return next();
    }

    const targetHouseId = req.params[paramKey] || req.body?.houseId;

    // Si hay un houseId explícito en la request, verificar que coincida
    if (targetHouseId && targetHouseId !== req.user.houseId) {
      return next(new AppError(403, "FORBIDDEN", "No perteneces a esta casa"));
    }

    next();
  };
}

