// ══════════════════════════════════════════════
// Users Service
// ══════════════════════════════════════════════

import { eq, and } from "drizzle-orm";
import { db, users, houseMembers } from "@homeassistan/database";
import { hashPin } from "./auth.service";
import { AppError } from "../middleware/error-handler";
import type { Role } from "@homeassistan/shared";

/** Crear usuario y asignarlo a una casa */
export async function createUser(data: {
  name: string;
  email?: string;
  personalPin: string;
  profileType?: "power" | "focus";
  houseId: string;
  role?: Role;
  // External access config
  accessSchedule?: unknown;
  allowedModules?: string[];
  accessExpiry?: string;
}) {
  const pinHash = await hashPin(data.personalPin);

  // Crear usuario
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      personalPinHash: pinHash,
      profileType: data.profileType || "power",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      profileType: users.profileType,
      createdAt: users.createdAt,
    });

  // Asignar a la casa
  await db.insert(houseMembers).values({
    houseId: data.houseId,
    userId: user.id,
    role: data.role || "member",
    ...(data.role === "external" && {
      accessSchedule: data.accessSchedule ?? null,
      allowedModules: data.allowedModules ?? null,
      accessExpiry: data.accessExpiry ? new Date(data.accessExpiry) : null,
    }),
  });

  return { ...user, role: data.role || "member" };
}

/** Obtener usuario por ID */
export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      profileType: users.profileType,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }
  return user;
}

/** Actualizar usuario */
export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    avatar?: string;
    profileType?: "power" | "focus";
  },
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.profileType) updateData.profileType = data.profileType;

  const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    avatar: users.avatar,
    profileType: users.profileType,
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }
  return user;
}

/** Eliminar usuario */
export async function deleteUser(id: string) {
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });

  if (!deleted) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }
}

/** Cambiar PIN de un usuario */
export async function changePin(id: string, currentPin: string, newPin: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }

  // Verificar PIN actual
  const { comparePin } = await import("./auth.service");
  const valid = await comparePin(currentPin, user.personalPinHash);
  if (!valid) {
    throw new AppError(400, "INVALID_PIN", "El PIN actual es incorrecto");
  }

  // Hashear y guardar nuevo PIN
  const newPinHash = await hashPin(newPin);
  await db.update(users).set({ personalPinHash: newPinHash, updatedAt: new Date() }).where(eq(users.id, id));
}

// ── House Members Management ──────────────────

/** Obtener miembros de una casa con info de usuario */
export async function getHouseMembers(houseId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      profileType: users.profileType,
      role: houseMembers.role,
      nickname: houseMembers.nickname,
      joinedAt: houseMembers.joinedAt,
    })
    .from(houseMembers)
    .innerJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(houseMembers.houseId, houseId))
    .orderBy(houseMembers.joinedAt);
}

/** Cambiar rol de un miembro dentro de una casa */
export async function updateMemberRole(
  userId: string,
  houseId: string,
  newRole: Role,
) {
  const [updated] = await db
    .update(houseMembers)
    .set({ role: newRole })
    .where(
      and(eq(houseMembers.userId, userId), eq(houseMembers.houseId, houseId)),
    )
    .returning();

  if (!updated) {
    throw new AppError(404, "MEMBER_NOT_FOUND", "Miembro no encontrado en esta casa");
  }

  return updated;
}

/** Eliminar un miembro de una casa (no elimina el usuario) */
export async function removeMember(userId: string, houseId: string) {
  const [deleted] = await db
    .delete(houseMembers)
    .where(
      and(eq(houseMembers.userId, userId), eq(houseMembers.houseId, houseId)),
    )
    .returning();

  if (!deleted) {
    throw new AppError(404, "MEMBER_NOT_FOUND", "Miembro no encontrado en esta casa");
  }

  return deleted;
}
