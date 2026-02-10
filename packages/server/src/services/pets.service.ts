// ══════════════════════════════════════════════
// Pets Service — CRUD de mascotas
// ══════════════════════════════════════════════

import { eq, and } from "drizzle-orm";
import { db, pets } from "@homeassistan/database";
import { AppError } from "../middleware/error-handler";

/** Obtener todas las mascotas de una casa */
export async function getPetsByHouse(houseId: string) {
  return db
    .select()
    .from(pets)
    .where(eq(pets.houseId, houseId))
    .orderBy(pets.name);
}

/** Obtener una mascota por ID */
export async function getPetById(id: string, houseId: string) {
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, id), eq(pets.houseId, houseId)))
    .limit(1);

  if (!pet) {
    throw new AppError(404, "PET_NOT_FOUND", "Mascota no encontrada");
  }
  return pet;
}

/** Crear una mascota */
export async function createPet(data: {
  houseId: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  weight?: number;
  avatar?: string;
  allergies?: string;
  vetName?: string;
  vetPhone?: string;
  notes?: string;
  createdBy: string;
}) {
  const [pet] = await db
    .insert(pets)
    .values({
      houseId: data.houseId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      birthDate: data.birthDate,
      weight: data.weight,
      avatar: data.avatar,
      allergies: data.allergies,
      vetName: data.vetName,
      vetPhone: data.vetPhone,
      notes: data.notes,
      createdBy: data.createdBy,
    })
    .returning();

  return pet;
}

/** Actualizar una mascota */
export async function updatePet(
  id: string,
  houseId: string,
  data: Partial<{
    name: string;
    species: string;
    breed: string | null;
    birthDate: string | null;
    weight: number | null;
    avatar: string | null;
    allergies: string | null;
    vetName: string | null;
    vetPhone: string | null;
    notes: string | null;
  }>,
) {
  const [pet] = await db
    .update(pets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(pets.id, id), eq(pets.houseId, houseId)))
    .returning();

  if (!pet) {
    throw new AppError(404, "PET_NOT_FOUND", "Mascota no encontrada");
  }
  return pet;
}

/** Eliminar una mascota */
export async function deletePet(id: string, houseId: string) {
  const [pet] = await db
    .delete(pets)
    .where(and(eq(pets.id, id), eq(pets.houseId, houseId)))
    .returning({ id: pets.id });

  if (!pet) {
    throw new AppError(404, "PET_NOT_FOUND", "Mascota no encontrada");
  }
}
