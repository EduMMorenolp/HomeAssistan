// ══════════════════════════════════════════════
// External Access Guard — Vigencia + Módulos
// ══════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db, houseMembers } from "@homeassistan/database";
import { AppError } from "./error-handler";

// Route-prefix → permission module mapping
const ROUTE_MODULE_MAP: Record<string, string> = {
  tasks: "tasks",
  finance: "finance",
  dashboard: "dashboard",
  communication: "communication",
  calendar: "calendar",
  health: "health",
  security: "security",
};

interface AccessSchedule {
  days?: string[]; // ['monday', 'wednesday', ...]
  timeStart?: string; // 'HH:mm'
  timeEnd?: string; // 'HH:mm'
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Middleware that enforces external user restrictions:
 * 1. Access expiry — rejects if accessExpiry has passed
 * 2. Schedule — rejects if current day/time is outside allowed schedule
 * 3. Module restriction — rejects if the route module is not in allowedModules
 *
 * Only applies to users with role 'external'. All other roles pass through.
 * Must be used AFTER `authenticate`.
 */
export function checkExternalAccess() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Only applies to external users
    if (!req.user || req.user.role !== "external") {
      return next();
    }

    try {
      // Fetch the membership record to get access restrictions
      const [membership] = await db
        .select({
          accessSchedule: houseMembers.accessSchedule,
          allowedModules: houseMembers.allowedModules,
          accessExpiry: houseMembers.accessExpiry,
        })
        .from(houseMembers)
        .where(
          and(
            eq(houseMembers.userId, req.user.userId),
            eq(houseMembers.houseId, req.user.houseId),
          ),
        );

      if (!membership) {
        return next(new AppError(403, "FORBIDDEN", "No eres miembro de esta casa"));
      }

      // ── 1. Check expiry ──
      if (membership.accessExpiry) {
        const now = new Date();
        if (now > new Date(membership.accessExpiry)) {
          return next(
            new AppError(
              403,
              "ACCESS_EXPIRED",
              "Tu acceso ha expirado. Contacta al responsable de la casa.",
            ),
          );
        }
      }

      // ── 2. Check schedule ──
      const schedule = membership.accessSchedule as AccessSchedule | null;
      if (schedule) {
        const now = new Date();

        // Check day
        if (schedule.days && schedule.days.length > 0) {
          const currentDay = DAY_NAMES[now.getDay()];
          if (!schedule.days.includes(currentDay!)) {
            return next(
              new AppError(
                403,
                "OUTSIDE_SCHEDULE",
                `Tu acceso está permitido solo los días: ${schedule.days.join(", ")}`,
              ),
            );
          }
        }

        // Check time window
        if (schedule.timeStart && schedule.timeEnd) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const [startH, startM] = schedule.timeStart.split(":").map(Number);
          const [endH, endM] = schedule.timeEnd.split(":").map(Number);
          const startMinutes = startH! * 60 + startM!;
          const endMinutes = endH! * 60 + endM!;

          if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            return next(
              new AppError(
                403,
                "OUTSIDE_SCHEDULE",
                `Tu acceso está permitido entre ${schedule.timeStart} y ${schedule.timeEnd}`,
              ),
            );
          }
        }
      }

      // ── 3. Check allowed modules ──
      if (membership.allowedModules && membership.allowedModules.length > 0) {
        // Extract module from the URL path: /api/<module>/...
        const pathSegments = req.originalUrl.split("/").filter(Boolean);
        // pathSegments: ['api', 'tasks', '...'] or ['api', 'finance', '...']
        const routePrefix = pathSegments[1]; // after 'api'

        if (routePrefix) {
          const permModule = ROUTE_MODULE_MAP[routePrefix];

          // If the route maps to a known module, check if it's allowed
          if (permModule && !membership.allowedModules.includes(permModule)) {
            return next(
              new AppError(
                403,
                "MODULE_RESTRICTED",
                `No tienes acceso al módulo: ${permModule}`,
              ),
            );
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
