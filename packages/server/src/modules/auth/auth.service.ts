// ══════════════════════════════════════════════
// Auth Service
// ══════════════════════════════════════════════

import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { eq, and, inArray } from "drizzle-orm";
import { db, houses, users, houseMembers, sessions } from "@homeassistan/database";
import type { Role } from "@homeassistan/shared";
import type {
  HouseSelectRequest,
  HouseSelectResponse,
  UserLoginRequest,
  UserLoginResponse,
  JwtPayload,
} from "@homeassistan/shared";
import { AppError } from "../../middleware/error-handler";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_OPTS: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
const SALT_ROUNDS = 12;

/** Paso 1: Seleccionar casa con PIN general */
export async function selectHouse(data: HouseSelectRequest): Promise<HouseSelectResponse> {
  const [house] = await db.select().from(houses).where(eq(houses.id, data.houseId)).limit(1);

  if (!house) {
    throw new AppError(404, "HOUSE_NOT_FOUND", "Casa no encontrada");
  }

  const isValid = await bcrypt.compare(data.pin, house.pinHash);
  if (!isValid) {
    throw new AppError(401, "INVALID_PIN", "PIN incorrecto");
  }

  // Token temporal para selección de usuario
  const houseToken = jwt.sign({ houseId: house.id }, JWT_SECRET, {
    expiresIn: "10m",
  });

  // Obtener miembros de la casa (sin mascotas, solo active/invited)
  const rawMembers = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      memberStatus: houseMembers.memberStatus,
    })
    .from(houseMembers)
    .innerJoin(users, eq(houseMembers.userId, users.id))
    .where(
      and(
        eq(houseMembers.houseId, house.id),
        inArray(houseMembers.memberStatus, ["active", "invited"]),
      ),
    );

  const members = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar ?? undefined,
    status: m.memberStatus as string,
  }));

  return {
    houseToken,
    houseName: house.name,
    members,
  };
}

/** Paso 2: Login de usuario con PIN personal */
export async function loginUser(data: UserLoginRequest): Promise<UserLoginResponse> {
  // Verificar house token
  let houseId: string;
  try {
    const decoded = jwt.verify(data.houseToken, JWT_SECRET) as {
      houseId: string;
    };
    houseId = decoded.houseId;
  } catch {
    throw new AppError(401, "INVALID_HOUSE_TOKEN", "Token de casa inválido");
  }

  // Buscar usuario
  const [user] = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }

  // Verificar PIN personal
  const isValid = await bcrypt.compare(data.personalPin, user.personalPinHash);
  if (!isValid) {
    throw new AppError(401, "INVALID_PIN", "PIN personal incorrecto");
  }

  // Obtener rol en la casa
  const [membership] = await db
    .select()
    .from(houseMembers)
    .where(
      and(
        eq(houseMembers.userId, user.id),
        eq(houseMembers.houseId, houseId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AppError(403, "NOT_A_MEMBER", "No eres miembro de esta casa");
  }

  // Check member status
  if (membership.memberStatus === "pending") {
    throw new AppError(403, "PENDING_APPROVAL", "Tu solicitud de acceso está pendiente de aprobación");
  }
  if (membership.memberStatus === "suspended") {
    throw new AppError(403, "SUSPENDED", "Tu acceso ha sido suspendido");
  }

  // If invited, require activation (temp PIN check)
  if (membership.memberStatus === "invited") {
    // Check if temp PIN matches instead of personal PIN
    if (membership.tempPinHash) {
      const tempValid = await bcrypt.compare(data.personalPin, membership.tempPinHash);
      if (tempValid) {
        // Return special response indicating activation needed
        const activationToken = jwt.sign(
          { userId: user.id, houseId, action: "activate" },
          JWT_SECRET,
          { expiresIn: "15m" },
        );
        throw new AppError(403, "ACTIVATION_REQUIRED", "Debes crear tu PIN personal", {
          activationToken,
          userName: user.name,
        });
      }
    }
    throw new AppError(401, "INVALID_PIN", "PIN incorrecto");
  }

  // Check external access expiry
  if (membership.role === "external" && membership.accessExpiry) {
    if (new Date() > new Date(membership.accessExpiry)) {
      throw new AppError(403, "ACCESS_EXPIRED", "Tu acceso ha expirado. Contacta al responsable de la casa.");
    }
  }

  // Generar tokens
  const payload: JwtPayload = {
    userId: user.id,
    houseId,
    role: membership.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" } as SignOptions);
  const refreshToken = jwt.sign(payload, JWT_SECRET, REFRESH_OPTS);

  // Guardar sesión
  await db.insert(sessions).values({
    userId: user.id,
    houseId,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      role: membership.role,
      profileType: user.profileType,
    },
  };
}

/** Refrescar access token */
export async function refreshToken(
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // Buscar sesión válida
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.refreshToken, token))
    .limit(1);

  if (!session || session.isRevoked) {
    throw new AppError(401, "INVALID_REFRESH", "Refresh token inválido");
  }

  if (new Date() > session.expiresAt) {
    throw new AppError(401, "TOKEN_EXPIRED", "Refresh token expirado");
  }

  // Verificar JWT
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Token inválido");
  }

  // Revocar token anterior
  await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.id, session.id));

  // Generar nuevos tokens
  const newPayload: JwtPayload = {
    userId: payload.userId,
    houseId: payload.houseId,
    role: payload.role,
  };

  const newAccessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: "1h" } as SignOptions);
  const newRefreshToken = jwt.sign(newPayload, JWT_SECRET, REFRESH_OPTS);

  // Guardar nueva sesión
  await db.insert(sessions).values({
    userId: payload.userId,
    houseId: payload.houseId,
    refreshToken: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/** Cerrar sesión */
export async function logout(userId: string): Promise<void> {
  await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));
}

/** Helper: hash de PIN */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/** Helper: comparar PIN con hash */
export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// ══════════════════════════════════════════════
// Onboarding: Invitación + Auto-registro
// ══════════════════════════════════════════════

/** Invitar usuario: crear con temp PIN y status 'invited' */
export async function inviteMember(data: {
  name: string;
  email?: string;
  houseId: string;
  role: Role;
  invitedBy: string;
  tempPin: string;
}) {
  const personalPinHash = await hashPin("0000"); // placeholder, user will set their own
  const tempPinHash = await hashPin(data.tempPin);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      personalPinHash,
      profileType: "power",
    })
    .returning({ id: users.id, name: users.name });

  await db.insert(houseMembers).values({
    houseId: data.houseId,
    userId: user.id,
    role: data.role,
    memberStatus: "invited",
    invitedBy: data.invitedBy,
    tempPinHash,
    tempPinExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { userId: user.id, name: user.name, tempPin: data.tempPin };
}

/** Activar cuenta invitada: cambiar temp PIN por PIN personal */
export async function activateAccount(data: {
  activationToken: string;
  newPin: string;
}) {
  let payload: { userId: string; houseId: string; action: string };
  try {
    payload = jwt.verify(data.activationToken, JWT_SECRET) as typeof payload;
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Token de activación inválido o expirado");
  }

  if (payload.action !== "activate") {
    throw new AppError(400, "INVALID_ACTION", "Token inválido");
  }

  const newPinHash = await hashPin(data.newPin);

  // Update user's personal PIN
  await db
    .update(users)
    .set({ personalPinHash: newPinHash, updatedAt: new Date() })
    .where(eq(users.id, payload.userId));

  // Update member status to active, clear temp PIN
  await db
    .update(houseMembers)
    .set({
      memberStatus: "active",
      tempPinHash: null,
      tempPinExpiry: null,
    })
    .where(
      and(
        eq(houseMembers.userId, payload.userId),
        eq(houseMembers.houseId, payload.houseId),
      ),
    );

  // Get membership for token generation
  const [membership] = await db
    .select()
    .from(houseMembers)
    .where(
      and(
        eq(houseMembers.userId, payload.userId),
        eq(houseMembers.houseId, payload.houseId),
      ),
    )
    .limit(1);

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

  // Generate login tokens
  const tokenPayload: JwtPayload = {
    userId: payload.userId,
    houseId: payload.houseId,
    role: membership.role,
  };

  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" } as SignOptions);
  const refreshToken = jwt.sign(tokenPayload, JWT_SECRET, REFRESH_OPTS);

  await db.insert(sessions).values({
    userId: payload.userId,
    houseId: payload.houseId,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      role: membership.role,
      profileType: user.profileType,
    },
  };
}

/** Auto-registro: usuario solicita acceso a una casa */
export async function selfRegister(data: {
  name: string;
  personalPin: string;
  houseId: string;
}) {
  // Verify the house exists
  const [house] = await db.select().from(houses).where(eq(houses.id, data.houseId)).limit(1);
  if (!house) {
    throw new AppError(404, "HOUSE_NOT_FOUND", "Casa no encontrada");
  }

  const pinHash = await hashPin(data.personalPin);

  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      personalPinHash: pinHash,
      profileType: "power",
    })
    .returning({ id: users.id, name: users.name });

  await db.insert(houseMembers).values({
    houseId: data.houseId,
    userId: user.id,
    role: "member",
    memberStatus: "pending",
  });

  return { userId: user.id, name: user.name, status: "pending" };
}

/** Aprobar solicitud de acceso */
export async function approveRequest(userId: string, houseId: string, approvedRole?: Role) {
  const [membership] = await db
    .select()
    .from(houseMembers)
    .where(
      and(
        eq(houseMembers.userId, userId),
        eq(houseMembers.houseId, houseId),
        eq(houseMembers.memberStatus, "pending"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AppError(404, "NOT_FOUND", "Solicitud no encontrada");
  }

  await db
    .update(houseMembers)
    .set({
      memberStatus: "active",
      role: approvedRole || membership.role,
    })
    .where(
      and(
        eq(houseMembers.userId, userId),
        eq(houseMembers.houseId, houseId),
      ),
    );

  return { userId, status: "active" };
}

/** Rechazar solicitud de acceso */
export async function rejectRequest(userId: string, houseId: string) {
  // Remove the pending membership
  const [deleted] = await db
    .delete(houseMembers)
    .where(
      and(
        eq(houseMembers.userId, userId),
        eq(houseMembers.houseId, houseId),
        eq(houseMembers.memberStatus, "pending"),
      ),
    )
    .returning();

  if (!deleted) {
    throw new AppError(404, "NOT_FOUND", "Solicitud no encontrada");
  }

  // Also delete user if they only had this membership
  const otherMemberships = await db
    .select()
    .from(houseMembers)
    .where(eq(houseMembers.userId, userId))
    .limit(1);

  if (otherMemberships.length === 0) {
    await db.delete(users).where(eq(users.id, userId));
  }
}

/** Obtener solicitudes pendientes de una casa */
export async function getPendingRequests(houseId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      requestedAt: houseMembers.joinedAt,
    })
    .from(houseMembers)
    .innerJoin(users, eq(houseMembers.userId, users.id))
    .where(
      and(
        eq(houseMembers.houseId, houseId),
        eq(houseMembers.memberStatus, "pending"),
      ),
    )
    .orderBy(houseMembers.joinedAt);
}
