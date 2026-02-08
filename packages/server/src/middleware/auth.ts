// ══════════════════════════════════════════════
// Auth Middleware - JWT Verification
// ══════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@homeassistan/shared";
import { AppError } from "./error-handler";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

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

/** Verifica que el usuario tenga uno de los roles permitidos */
export function authorize(...allowedRoles: string[]) {
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
