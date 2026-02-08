import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL!;

// Connection pool para queries
const queryClient = postgres(connectionString);

// Drizzle instance con schema
export const db = drizzle(queryClient, { schema });

// Para migraciones o conexión única
export function createConnection(url?: string) {
  const client = postgres(url ?? connectionString);
  return drizzle(client, { schema });
}
