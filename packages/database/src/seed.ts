// ══════════════════════════════════════════════
// Database Seed
// ══════════════════════════════════════════════

import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { houses, users, houseMembers, systemConfig } from "./schema/index";

const SALT_ROUNDS = 12;

async function seed() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("🌱 Seeding database...\n");

  // ── Crear casa demo ─────────────────────────
  const housePinHash = await bcrypt.hash("1234", SALT_ROUNDS);

  const [house] = await db
    .insert(houses)
    .values({
      name: "Casa Demo",
      address: "Calle Ejemplo 123",
      pinHash: housePinHash,
    })
    .returning();

  console.log(`🏠 Casa creada: ${house.name} (PIN: 1234)`);

  // ── Crear usuarios ──────────────────────────
  const adminPinHash = await bcrypt.hash("0000", SALT_ROUNDS);
  const responsiblePinHash = await bcrypt.hash("3333", SALT_ROUNDS);
  const memberPinHash = await bcrypt.hash("1111", SALT_ROUNDS);
  const simplifiedPinHash = await bcrypt.hash("2222", SALT_ROUNDS);
  const externalPinHash = await bcrypt.hash("4444", SALT_ROUNDS);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@home.local",
      personalPinHash: adminPinHash,
      profileType: "power",
    })
    .returning();

  const [responsible] = await db
    .insert(users)
    .values({
      name: "Carlos",
      email: "carlos@home.local",
      personalPinHash: responsiblePinHash,
      profileType: "power",
    })
    .returning();

  const [member] = await db
    .insert(users)
    .values({
      name: "María",
      email: "maria@home.local",
      personalPinHash: memberPinHash,
      profileType: "power",
    })
    .returning();

  const [simplified] = await db
    .insert(users)
    .values({
      name: "Abuelo",
      personalPinHash: simplifiedPinHash,
      profileType: "focus",
    })
    .returning();

  const [external] = await db
    .insert(users)
    .values({
      name: "Limpieza",
      personalPinHash: externalPinHash,
      profileType: "power",
    })
    .returning();

  console.log(`👤 Admin creado (PIN: 0000)`);
  console.log(`👤 Carlos creado — responsible (PIN: 3333)`);
  console.log(`👤 María creada — member (PIN: 1111)`);
  console.log(`👤 Abuelo creado — simplified (PIN: 2222)`);
  console.log(`👤 Limpieza creado — external (PIN: 4444)`);

  // ── Asignar miembros a la casa ──────────────
  await db.insert(houseMembers).values([
    { houseId: house.id, userId: admin.id, role: "admin" },
    { houseId: house.id, userId: responsible.id, role: "responsible" },
    { houseId: house.id, userId: member.id, role: "member" },
    { houseId: house.id, userId: simplified.id, role: "simplified" },
    { houseId: house.id, userId: external.id, role: "external" },
  ]);

  // ── Configuración global del sistema ────────
  await db.insert(systemConfig).values([
    {
      key: "allow_house_creation",
      value: "admin_only",
      description: "Quién puede crear casas: admin_only | admin_and_responsible",
    },
    {
      key: "allow_self_registration",
      value: "false",
      description: "Permitir auto-registro de usuarios",
    },
    {
      key: "max_houses_per_responsible",
      value: "3",
      description: "Máximo de casas que un responsable puede crear",
    },
    {
      key: "session_timeout_minutes",
      value: "60",
      description: "Tiempo de expiración de sesión en minutos",
    },
  ]);

  console.log(`\n✅ Seed completado!`);
  console.log(`\n📋 Resumen:`);
  console.log(`   Casa: "${house.name}" | PIN: 1234`);
  console.log(`   Admin: "Admin" | PIN: 0000`);
  console.log(`   Responsible: "Carlos" | PIN: 3333`);
  console.log(`   Miembro: "María" | PIN: 1111`);
  console.log(`   Simplificado: "Abuelo" | PIN: 2222`);
  console.log(`   Externo: "Limpieza" | PIN: 4444`);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
