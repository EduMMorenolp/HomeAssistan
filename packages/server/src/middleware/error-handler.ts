// ══════════════════════════════════════════════
// Error Handler Middleware
// ══════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "@homeassistan/shared";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Error]", err);

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "Error interno del servidor" : err.message,
    },
  };
  res.status(500).json(response);
}
