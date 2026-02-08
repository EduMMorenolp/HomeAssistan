// ══════════════════════════════════════════════
// Auth Service
// ══════════════════════════════════════════════

import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, houses, users, houseMembers, sessions } from "@homeassistan/database";
import type {
  HouseSelectRequest,
  HouseSelectResponse,
  UserLoginRequest,
  UserLoginResponse,
  JwtPayload,
} from "@homeassistan/shared";
import { AppError } from "../middleware/error-handler";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_OPTS: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
const SALT_ROUNDS = 12;

/** Paso 1: Seleccionar casa con PIN general */
export async function selectHouse(
  data: HouseSelectRequest
): Promise<HouseSelectResponse> {
  const [house] = await db
    .select()
    .from(houses)
    .where(eq(houses.id, data.houseId))
    .limit(1);

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

  // Obtener miembros de la casa (sin mascotas, ellos no hacen login)
  const rawMembers = await db
    .select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
    })
    .from(houseMembers)
    .innerJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(houseMembers.houseId, house.id));

  const members = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar ?? undefined,
  }));

  return {
    houseToken,
    houseName: house.name,
    members,
  };
}

/** Paso 2: Login de usuario con PIN personal */
export async function loginUser(
  data: UserLoginRequest
): Promise<UserLoginResponse> {
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
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

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
    .where(eq(houseMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    throw new AppError(403, "NOT_A_MEMBER", "No eres miembro de esta casa");
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
  token: string
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
  await db
    .update(sessions)
    .set({ isRevoked: true })
    .where(eq(sessions.id, session.id));

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
  await db
    .update(sessions)
    .set({ isRevoked: true })
    .where(eq(sessions.userId, userId));
}

/** Helper: hash de PIN */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}
