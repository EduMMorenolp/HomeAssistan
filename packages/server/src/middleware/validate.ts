// ══════════════════════════════════════════════
// Validation Middleware (Zod)
// ══════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "./error-handler";

/**
 * Valida el body del request contra un schema Zod.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(400, "VALIDATION_ERROR", "Datos inválidos", {
            issues: error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            })),
          }),
        );
        return;
      }
      next(error);
    }
  };
}
