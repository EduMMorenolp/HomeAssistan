// ══════════════════════════════════════════════
// Houses Service
// ══════════════════════════════════════════════

import { eq } from "drizzle-orm";
import { db, houses, houseMembers, users } from "@homeassistan/database";
import { hashPin } from "./auth.service";
import { AppError } from "../middleware/error-handler";

/** Listar casas (solo id y nombre, sin PIN) */
export async function getAllHouses() {
  return db
    .select({
      id: houses.id,
      name: houses.name,
      address: houses.address,
    })
    .from(houses);
}

/** Obtener casa por ID */
export async function getHouseById(id: string) {
  const [house] = await db
    .select({
      id: houses.id,
      name: houses.name,
      address: houses.address,
      createdAt: houses.createdAt,
    })
    .from(houses)
    .where(eq(houses.id, id))
    .limit(1);

  if (!house) {
    throw new AppError(404, "HOUSE_NOT_FOUND", "Casa no encontrada");
  }
  return house;
}

/** Crear nueva casa */
export async function createHouse(data: {
  name: string;
  address?: string;
  pin: string;
}) {
  const pinHash = await hashPin(data.pin);

  const [house] = await db
    .insert(houses)
    .values({
      name: data.name,
      address: data.address,
      pinHash,
    })
    .returning({
      id: houses.id,
      name: houses.name,
      address: houses.address,
      createdAt: houses.createdAt,
    });

  return house;
}

/** Actualizar casa */
export async function updateHouse(
  id: string,
  data: { name?: string; address?: string; pin?: string }
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.pin) updateData.pinHash = await hashPin(data.pin);

  const [house] = await db
    .update(houses)
    .set(updateData)
    .where(eq(houses.id, id))
    .returning({
      id: houses.id,
      name: houses.name,
      address: houses.address,
    });

  if (!house) {
    throw new AppError(404, "HOUSE_NOT_FOUND", "Casa no encontrada");
  }
  return house;
}

/** Eliminar casa */
export async function deleteHouse(id: string) {
  const [deleted] = await db
    .delete(houses)
    .where(eq(houses.id, id))
    .returning({ id: houses.id });

  if (!deleted) {
    throw new AppError(404, "HOUSE_NOT_FOUND", "Casa no encontrada");
  }
}

/** Obtener miembros de una casa */
export async function getHouseMembers(houseId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      avatar: users.avatar,
      role: houseMembers.role,
      nickname: houseMembers.nickname,
      joinedAt: houseMembers.joinedAt,
    })
    .from(houseMembers)
    .innerJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(houseMembers.houseId, houseId));
}
