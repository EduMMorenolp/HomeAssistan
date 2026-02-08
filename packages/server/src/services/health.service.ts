// ══════════════════════════════════════════════
// Health Service
// ══════════════════════════════════════════════

import { eq, and, desc } from "drizzle-orm";
import {
  db,
  healthProfiles,
  medications,
  medicationLogs,
  healthRoutines,
  users,
} from "@homeassistan/database";
import type {
  UpsertHealthProfileRequest,
  CreateMedicationRequest,
  UpdateMedicationRequest,
  LogMedicationRequest,
  CreateHealthRoutineRequest,
} from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

// ══════════════════════════════════════════════
// PERFILES DE SALUD
// ══════════════════════════════════════════════

export async function getHealthProfiles(houseId: string) {
  return db
    .select({
      id: healthProfiles.id,
      userId: healthProfiles.userId,
      userName: users.name,
      bloodType: healthProfiles.bloodType,
      allergies: healthProfiles.allergies,
      conditions: healthProfiles.conditions,
      emergencyNotes: healthProfiles.emergencyNotes,
      doctorName: healthProfiles.doctorName,
      doctorPhone: healthProfiles.doctorPhone,
      insuranceInfo: healthProfiles.insuranceInfo,
    })
    .from(healthProfiles)
    .leftJoin(users, eq(healthProfiles.userId, users.id))
    .where(eq(healthProfiles.houseId, houseId));
}

export async function upsertHealthProfile(
  userId: string,
  houseId: string,
  data: UpsertHealthProfileRequest,
) {
  const [existing] = await db
    .select()
    .from(healthProfiles)
    .where(and(eq(healthProfiles.userId, userId), eq(healthProfiles.houseId, houseId)));

  if (existing) {
    const [updated] = await db
      .update(healthProfiles)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(healthProfiles.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(healthProfiles)
    .values({ userId, houseId, ...data } as any)
    .returning();
  return created;
}

// ══════════════════════════════════════════════
// MEDICAMENTOS
// ══════════════════════════════════════════════

export async function getMedications(houseId: string) {
  return db
    .select({
      id: medications.id,
      userId: medications.userId,
      userName: users.name,
      name: medications.name,
      dosage: medications.dosage,
      frequency: medications.frequency,
      timeOfDay: medications.timeOfDay,
      instructions: medications.instructions,
      stock: medications.stock,
      minStock: medications.minStock,
      isActive: medications.isActive,
      startDate: medications.startDate,
      endDate: medications.endDate,
    })
    .from(medications)
    .leftJoin(users, eq(medications.userId, users.id))
    .where(eq(medications.houseId, houseId))
    .orderBy(desc(medications.createdAt));
}

export async function createMedication(houseId: string, data: CreateMedicationRequest) {
  const [row] = await db
    .insert(medications)
    .values({
      houseId,
      userId: data.userId,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency ?? "daily",
      timeOfDay: data.timeOfDay,
      instructions: data.instructions,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 5,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    } as any)
    .returning();
  return row;
}

export async function updateMedication(id: string, houseId: string, data: UpdateMedicationRequest) {
  const [existing] = await db
    .select()
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.houseId, houseId)));
  if (!existing) throw new AppError(404, "MEDICATION_NOT_FOUND", "Medicamento no encontrado");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.dosage !== undefined) updateData.dosage = data.dosage;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.timeOfDay !== undefined) updateData.timeOfDay = data.timeOfDay;
  if (data.instructions !== undefined) updateData.instructions = data.instructions;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.minStock !== undefined) updateData.minStock = data.minStock;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

  const [updated] = await db
    .update(medications)
    .set(updateData as any)
    .where(eq(medications.id, id))
    .returning();
  return updated;
}

export async function deleteMedication(id: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.houseId, houseId)));
  if (!existing) throw new AppError(404, "MEDICATION_NOT_FOUND", "Medicamento no encontrado");

  await db.delete(medicationLogs).where(eq(medicationLogs.medicationId, id));
  await db.delete(medications).where(eq(medications.id, id));
}

// ── Medication Logs ──────────────────────────

export async function logMedication(userId: string, data: LogMedicationRequest) {
  const [row] = await db
    .insert(medicationLogs)
    .values({
      medicationId: data.medicationId,
      userId,
      wasSkipped: data.wasSkipped ?? false,
      note: data.note,
    })
    .returning();
  return row;
}

export async function getMedicationLogs(medicationId: string) {
  return db
    .select({
      id: medicationLogs.id,
      medicationId: medicationLogs.medicationId,
      userId: medicationLogs.userId,
      userName: users.name,
      takenAt: medicationLogs.takenAt,
      wasSkipped: medicationLogs.wasSkipped,
      note: medicationLogs.note,
    })
    .from(medicationLogs)
    .leftJoin(users, eq(medicationLogs.userId, users.id))
    .where(eq(medicationLogs.medicationId, medicationId))
    .orderBy(desc(medicationLogs.takenAt))
    .limit(50);
}

// ══════════════════════════════════════════════
// RUTINAS DE SALUD
// ══════════════════════════════════════════════

export async function getHealthRoutines(houseId: string) {
  return db
    .select({
      id: healthRoutines.id,
      userId: healthRoutines.userId,
      userName: users.name,
      name: healthRoutines.name,
      description: healthRoutines.description,
      timeOfDay: healthRoutines.timeOfDay,
      daysOfWeek: healthRoutines.daysOfWeek,
      isActive: healthRoutines.isActive,
    })
    .from(healthRoutines)
    .leftJoin(users, eq(healthRoutines.userId, users.id))
    .where(eq(healthRoutines.houseId, houseId));
}

export async function createHealthRoutine(houseId: string, data: CreateHealthRoutineRequest) {
  const [row] = await db
    .insert(healthRoutines)
    .values({
      houseId,
      userId: data.userId,
      name: data.name,
      description: data.description,
      timeOfDay: data.timeOfDay,
      daysOfWeek: data.daysOfWeek ?? [1, 2, 3, 4, 5],
    } as any)
    .returning();
  return row;
}

export async function deleteHealthRoutine(id: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(healthRoutines)
    .where(and(eq(healthRoutines.id, id), eq(healthRoutines.houseId, houseId)));
  if (!existing) throw new AppError(404, "ROUTINE_NOT_FOUND", "Rutina no encontrada");

  await db.delete(healthRoutines).where(eq(healthRoutines.id, id));
}
