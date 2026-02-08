// ══════════════════════════════════════════════
// Users Service
// ══════════════════════════════════════════════

import { eq } from "drizzle-orm";
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
