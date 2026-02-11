// ══════════════════════════════════════════════
// Database Reset — Borra TODAS las tablas y las recrea
// ══════════════════════════════════════════════

import "dotenv/config";
import postgres from "postgres";

async function reset() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);

  console.log("⚠️  Reseteando base de datos...\n");

  // Eliminar todas las tablas del schema public
  await client.unsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      -- Desactivar restricciones de FK temporalmente
      EXECUTE 'SET session_replication_role = replica';

      -- Borrar todas las tablas
      FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
      ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
      END LOOP;

      -- Borrar todos los tipos enum
      FOR r IN (
        SELECT typname FROM pg_type
        WHERE typnamespace = 'public'::regnamespace AND typtype = 'e'
      ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Dropped enum: %', r.typname;
      END LOOP;

      -- Reactivar restricciones de FK
      EXECUTE 'SET session_replication_role = DEFAULT';
    END $$;
  `);

  console.log("🗑️  Todas las tablas y enums eliminados.");

  await client.end();

  console.log("\n✅ Base de datos limpia. Ejecuta ahora:");
  console.log("   pnpm db:push   → recrear tablas desde el schema");
  console.log("   pnpm db:seed   → poblar con datos iniciales");

  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
