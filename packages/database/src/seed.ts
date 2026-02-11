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

  // ── Crear casa Admin ─────────────────────────
  const housePinHash = await bcrypt.hash("1234", SALT_ROUNDS);

  const [house] = await db
    .insert(houses)
    .values({
      name: "Casa Admin",
      address: "Calle Falsa 123",
      pinHash: housePinHash,
    })
    .returning();

  console.log(`🏠 Casa creada: ${house.name} (PIN: 1234)`);

  // ── Crear usuarios ──────────────────────────
  const adminPinHash = await bcrypt.hash("0000", SALT_ROUNDS);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@home.local",
      personalPinHash: adminPinHash,
      profileType: "power",
    })
    .returning();

  console.log(`👤 Admin creado (PIN: 0000)`);

  // ── Asignar miembros a la casa ──────────────
  await db.insert(houseMembers).values([
    { houseId: house.id, userId: admin.id, role: "admin" },
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

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
