// ══════════════════════════════════════════════
// Database Seed
// ══════════════════════════════════════════════

import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { houses, users, houseMembers } from "./schema/index";

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
  const memberPinHash = await bcrypt.hash("1111", SALT_ROUNDS);
  const simplifiedPinHash = await bcrypt.hash("2222", SALT_ROUNDS);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@home.local",
      personalPinHash: adminPinHash,
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

  console.log(`👤 Admin creado (PIN: 0000)`);
  console.log(`👤 María creada (PIN: 1111)`);
  console.log(`👤 Abuelo creado (PIN: 2222)`);

  // ── Asignar miembros a la casa ──────────────
  await db.insert(houseMembers).values([
    { houseId: house.id, userId: admin.id, role: "admin" },
    { houseId: house.id, userId: member.id, role: "member" },
    { houseId: house.id, userId: simplified.id, role: "simplified" },
  ]);

  console.log(`\n✅ Seed completado!`);
  console.log(`\n📋 Resumen:`);
  console.log(`   Casa: "${house.name}" | PIN: 1234`);
  console.log(`   Admin: "Admin" | PIN: 0000`);
  console.log(`   Miembro: "María" | PIN: 1111`);
  console.log(`   Simplificado: "Abuelo" | PIN: 2222`);

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
