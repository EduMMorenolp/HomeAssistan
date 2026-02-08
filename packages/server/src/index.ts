// ══════════════════════════════════════════════
// HomeAsisstan - Server Entry Point
// ══════════════════════════════════════════════

import { config } from "dotenv";
import { resolve } from "path";

// Cargar .env desde la raíz del monorepo ANTES de importar módulos que usen process.env
config({ path: resolve(import.meta.dirname, "../../../.env") });

// Dynamic imports para que database/client lea DATABASE_URL ya cargado
const { app } = await import("./app.js");
const { createServer } = await import("http");
const { setupSocketIO } = await import("./socket.js");

const PORT = parseInt(process.env.PORT || "3001", 10);

const httpServer = createServer(app);

// WebSocket setup
setupSocketIO(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  🏠 HomeAsisstan Server             ║
  ║  Running on http://0.0.0.0:${PORT}   ║
  ║  Environment: ${process.env.NODE_ENV || "development"}       ║
  ╚══════════════════════════════════════╝
  `);
});
