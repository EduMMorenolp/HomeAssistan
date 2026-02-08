// ══════════════════════════════════════════════
// Security Service
// ══════════════════════════════════════════════

import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import {
  db,
  emergencyContacts,
  secureVault,
  visitorCodes,
  accessLogs,
  users,
} from "@homeassistan/database";
import type {
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
  CreateVaultEntryRequest,
  UpdateVaultEntryRequest,
  CreateVisitorCodeRequest,
} from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

// ══════════════════════════════════════════════
// CONTACTOS DE EMERGENCIA
// ══════════════════════════════════════════════

export async function getEmergencyContacts(houseId: string) {
  return db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.houseId, houseId))
    .orderBy(desc(emergencyContacts.isPrimary));
}

export async function createEmergencyContact(
  houseId: string,
  data: CreateEmergencyContactRequest,
) {
  const [row] = await db
    .insert(emergencyContacts)
    .values({
      houseId,
      name: data.name,
      phone: data.phone,
      relationship: data.relationship,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes,
    })
    .returning();
  return row;
}

export async function updateEmergencyContact(
  id: string,
  houseId: string,
  data: UpdateEmergencyContactRequest,
) {
  const [existing] = await db
    .select()
    .from(emergencyContacts)
    .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.houseId, houseId)));
  if (!existing) throw new AppError(404, "CONTACT_NOT_FOUND", "Contacto no encontrado");

  const [updated] = await db
    .update(emergencyContacts)
    .set({ ...data } as any)
    .where(eq(emergencyContacts.id, id))
    .returning();
  return updated;
}

export async function deleteEmergencyContact(id: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(emergencyContacts)
    .where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.houseId, houseId)));
  if (!existing) throw new AppError(404, "CONTACT_NOT_FOUND", "Contacto no encontrado");

  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
}

// ══════════════════════════════════════════════
// BÓVEDA SEGURA
// ══════════════════════════════════════════════

export async function getVaultEntries(houseId: string) {
  return db
    .select({
      id: secureVault.id,
      category: secureVault.category,
      label: secureVault.label,
      value: secureVault.value,
      notes: secureVault.notes,
      createdBy: secureVault.createdBy,
      createdAt: secureVault.createdAt,
    })
    .from(secureVault)
    .where(eq(secureVault.houseId, houseId))
    .orderBy(secureVault.category, secureVault.label);
}

export async function createVaultEntry(
  houseId: string,
  createdBy: string,
  data: CreateVaultEntryRequest,
) {
  const [row] = await db
    .insert(secureVault)
    .values({
      houseId,
      createdBy,
      category: data.category,
      label: data.label,
      value: data.value,
      notes: data.notes,
    })
    .returning();
  return row;
}

export async function updateVaultEntry(
  id: string,
  houseId: string,
  data: UpdateVaultEntryRequest,
) {
  const [existing] = await db
    .select()
    .from(secureVault)
    .where(and(eq(secureVault.id, id), eq(secureVault.houseId, houseId)));
  if (!existing) throw new AppError(404, "VAULT_ENTRY_NOT_FOUND", "Entrada no encontrada");

  const [updated] = await db
    .update(secureVault)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(secureVault.id, id))
    .returning();
  return updated;
}

export async function deleteVaultEntry(id: string, houseId: string) {
  const [existing] = await db
    .select()
    .from(secureVault)
    .where(and(eq(secureVault.id, id), eq(secureVault.houseId, houseId)));
  if (!existing) throw new AppError(404, "VAULT_ENTRY_NOT_FOUND", "Entrada no encontrada");

  await db.delete(secureVault).where(eq(secureVault.id, id));
}

// ══════════════════════════════════════════════
// CÓDIGOS DE VISITANTE
// ══════════════════════════════════════════════

export async function getVisitorCodes(houseId: string) {
  return db
    .select()
    .from(visitorCodes)
    .where(eq(visitorCodes.houseId, houseId))
    .orderBy(desc(visitorCodes.createdAt));
}

export async function generateVisitorCode(
  houseId: string,
  createdBy: string,
  data: CreateVisitorCodeRequest,
) {
  const code = randomBytes(4).toString("hex").toUpperCase();
  const [row] = await db
    .insert(visitorCodes)
    .values({
      houseId,
      createdBy,
      code,
      label: data.label,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    } as any)
    .returning();
  return row;
}

export async function useVisitorCode(code: string) {
  const [entry] = await db
    .select()
    .from(visitorCodes)
    .where(eq(visitorCodes.code, code));

  if (!entry) throw new AppError(404, "INVALID_CODE", "Código inválido");
  if (entry.isUsed) throw new AppError(400, "CODE_ALREADY_USED", "Código ya utilizado");
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    throw new AppError(400, "CODE_EXPIRED", "Código expirado");
  }

  const [updated] = await db
    .update(visitorCodes)
    .set({ isUsed: true, usedAt: new Date() })
    .where(eq(visitorCodes.id, entry.id))
    .returning();
  return updated;
}

export async function deleteVisitorCode(id: string, houseId: string) {
  await db
    .delete(visitorCodes)
    .where(and(eq(visitorCodes.id, id), eq(visitorCodes.houseId, houseId)));
}

// ══════════════════════════════════════════════
// LOGS DE ACCESO
// ══════════════════════════════════════════════

export async function getAccessLogs(houseId: string, limit = 100) {
  return db
    .select({
      id: accessLogs.id,
      userId: accessLogs.userId,
      userName: users.name,
      action: accessLogs.action,
      ipAddress: accessLogs.ipAddress,
      details: accessLogs.details,
      createdAt: accessLogs.createdAt,
    })
    .from(accessLogs)
    .leftJoin(users, eq(accessLogs.userId, users.id))
    .where(eq(accessLogs.houseId, houseId))
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

export async function logAccess(
  houseId: string,
  userId: string | null,
  action: string,
  ipAddress?: string,
  details?: Record<string, unknown>,
) {
  await db.insert(accessLogs).values({
    houseId,
    userId,
    action,
    ipAddress,
    details,
  } as any);
}
